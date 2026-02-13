import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

const Toast = ({ message, type = 'success', duration = 3000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === 'success'
      ? 'bg-green-50 border-green-500 text-green-700'
      : 'bg-red-50 border-red-500 text-red-700';

  const progressColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-5 right-5 z-50 animate-slideIn">
      <div className={`relative w-80 shadow-lg rounded-lg border-l-4 p-4 ${bgColor}`}>
        <p className="text-sm font-medium">{message}</p>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden rounded-b-lg">
          <div
            className={`h-full ${progressColor} animate-progress`}
            style={{ animationDuration: `${duration}ms` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
