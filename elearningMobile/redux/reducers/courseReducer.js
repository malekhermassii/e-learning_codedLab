import {
  FETCH_COURSE_PROGRESS_SUCCESS,
  FETCH_COURSE_PROGRESS_FAILURE,
  FETCH_COURSE_DETAILS_SUCCESS,
  FETCH_COURSE_DETAILS_FAILURE
} from '../types/courseTypes';

const initialState = {
  progress: [],
  courses: [],
  loading: false,
  error: null
};

const courseReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_COURSE_PROGRESS_SUCCESS:
      return {
        ...state,
        progress: action.payload,
        loading: false,
        error: null
      };
    case FETCH_COURSE_PROGRESS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case FETCH_COURSE_DETAILS_SUCCESS:
      return {
        ...state,
        courses: action.payload,
        loading: false,
        error: null
      };
    case FETCH_COURSE_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export default courseReducer;
