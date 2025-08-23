import { useState, useEffect } from 'react';
import { DeviceType } from '../types';

/**
 * A hook to detect whether the user is on a mobile or desktop device.
 * It uses the User-Agent Client Hints API for modern browsers and falls
 * back to a user-agent string check for others.
 *
 * @returns {DeviceType} 'mobile' or 'desktop'
 */
export const useDevice = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      let isMobile = false;
      // Prefer the newer User-Agent Client Hints API
      // @ts-ignore - userAgentData is not in all TS lib versions
      if (navigator.userAgentData) {
        // @ts-ignore
        isMobile = navigator.userAgentData.mobile;
      } else {
        // Fallback to a regex for the user agent string
        const mobileRegex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        isMobile = mobileRegex.test(navigator.userAgent);
      }
      setDeviceType(isMobile ? 'mobile' : 'desktop');
    };

    checkDevice();
  }, []);

  return deviceType;
};
