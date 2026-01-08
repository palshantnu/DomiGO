import { useEffect } from 'react';
import { AppState } from 'react-native';
import { checkGPSStatus } from '../helpers/gpsStatus';

export const useGPSListener = (setGPSState) => {
  useEffect(() => {
    let currentState = AppState.currentState;

    const checkGPS = async () => {
      const status = await checkGPSStatus();
      setGPSState(status);
    };

    // initial check
    checkGPS();

    const sub = AppState.addEventListener('change', nextState => {
      if (
        currentState.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        checkGPS(); // 🔁 recheck when app returns
      }
      currentState = nextState;
    });

    return () => sub.remove();
  }, []);
};
