import { useEffect, type Dispatch, type SetStateAction } from 'react';

export const useBrowserAlert = (
  message: string,
  clearMessage: Dispatch<SetStateAction<string>>
) => {
  useEffect(() => {
    if (!message) return;
    window.alert(message);
    clearMessage('');
  }, [message, clearMessage]);
};
