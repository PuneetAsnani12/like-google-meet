import { takeLatest, put, all, call } from "redux-saga/effects";
import UserActionTypes from "./user.types";
import {
  googleProvider,
  auth,
  createUserProfileDocument,
  getCurrentUser,
} from "../../firebase/firebase.utils";
import { signInWithPopup } from "firebase/auth";
import { getDoc } from "firebase/firestore";

import {
  signInSuccess,
  signInFailure,
  signOutFailure,
  signOutSuccess,
  userNotAuthenticated,
} from "./users.actions";

function* OnSignOut() {
  try {
    yield auth.signOut();
    yield put(signOutSuccess());
  } catch (error) {
    yield put(signOutFailure(error));
  }
}
function* getSnapshotFromUserAuth(userAuth, additionalData, flag = 0) {
  try {
    const userRef = yield call(
      createUserProfileDocument,
      userAuth,
      additionalData
    );
    const userSnapshot = yield getDoc(userRef);
    let photoURL = "";
    try {
      photoURL = userAuth.photoURL;
      photoURL = photoURL.replace("s96-c", "s200-c", true);
    } catch (err) {
      console.log(err);
    }
    yield put(
      signInSuccess({ id: userSnapshot.id, photoURL, ...userSnapshot.data() })
    );
  } catch (error) {
    console.log(error);
    yield put(signInFailure(error));
  }
}

export function* signInWithGoogle() {
  try {
    const { user } = yield signInWithPopup(auth, googleProvider);
    yield getSnapshotFromUserAuth(user, null, 1);
  } catch (error) {
    yield put(signInFailure(error));
  }
}

export function* onGoogleSignInStart() {
  yield takeLatest(UserActionTypes.GOOGLE_SIGN_IN_START, signInWithGoogle);
}

export function* isUserAuthenticated() {
  try {
    const userAuth = yield getCurrentUser();
    if (!userAuth) {
      yield put(userNotAuthenticated());
      return;
    }
    yield getSnapshotFromUserAuth(userAuth);
  } catch (error) {
    yield put(signInFailure(error));
  }
}

export function* onCheckUserSession() {
  yield takeLatest(UserActionTypes.CHECK_USER_SESSION, isUserAuthenticated);
}

export function* onSignOutStart() {
  yield takeLatest(UserActionTypes.SIGN_OUT_START, OnSignOut);
}

export function* userSaga() {
  yield all([
    call(onGoogleSignInStart),
    call(onCheckUserSession),
    call(onSignOutStart),
  ]);
}
