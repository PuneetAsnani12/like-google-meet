import UserActionTypes from "./user.types";

const INITIAL_STATE = {
  currentUser: null,
  loading: false,
};

const userReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UserActionTypes.CHECK_USER_SESSION:
      return {
        ...state,
        loading: true,
      };
    case UserActionTypes.USER_NOT_AUTHENTICATED:
      return {
        ...state,
        loading: false,
      };
    case UserActionTypes.GOOGLE_SIGN_IN_START:
      return {
        ...state,
        loading: true,
      };
    case UserActionTypes.SIGN_OUT_START:
      return {
        ...state,
        loading: true,
      };
    case UserActionTypes.SIGN_IN_SUCCESS:
      return {
        ...state,
        currentUser: action.payload,
        error: null,
        loading: false,
      };
    case UserActionTypes.SIGN_OUT_SUCCESS:
      return {
        ...state,
        currentUser: null,
        error: null,
        loading: false,
      };
    case UserActionTypes.SIGN_IN_FAILURE:
    case UserActionTypes.SIGN_OUT_FAILURE:
      return {
        ...state,
        error: action.payload,
        message: "Something went wrong",
        loading: false,
      };
    default:
      return state;
  }
};

export default userReducer;
