// Configuration file for the React app
export const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL ,
  
  // App Configuration
  APP_NAME: 'ClassScheduler',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  FEATURES: {
    ENABLE_ANIMATIONS: true,
    ENABLE_DARK_MODE: false,
    ENABLE_OFFLINE_MODE: false,
  },
  
  // UI Configuration
  UI: {
    SIDEBAR_WIDTH: 256,
    HEADER_HEIGHT: 64,
    ANIMATION_DURATION: 300,
  },
  
  // Table Configuration
  TABLE: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
  
  // Timetable Configuration
  TIMETABLE: {
    DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    PERIODS: ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'],
    TIME_SLOTS: {
      'Period 1': '09:00 - 10:00',
      'Period 2': '10:00 - 11:00',
      'Period 3': '11:15 - 12:15',
      'Period 4': '12:15 - 13:15',
      'Period 5': '14:00 - 15:00',
      'Period 6': '15:00 - 16:00',
    }
  }
};

export default config;
