import React from 'react';
import { Button } from './Button';

interface ThumbnailToolbarProps {
  onNudge: (seconds: number) => void;
  onUseFrame: () => void;
  busy?: boolean;
  disabled?: boolean;
}

export const ThumbnailToolbar: React.FC<ThumbnailToolbarProps> = ({
  onNudge,
  onUseFrame,
  busy = false,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
      <Button
        size="sm"
        onClick={() => onNudge(-0.5)}
        disabled={disabled}
      >
        −0.5s
      </Button>
      
      <Button
        size="sm"
        onClick={() => onNudge(-0.1)}
        disabled={disabled}
      >
        −0.1s
      </Button>
      
      <Button
        variant="primary"
        onClick={onUseFrame}
        disabled={disabled || busy}
        loading={busy}
      >
        {busy ? 'Capturing…' : 'Use This Frame'}
      </Button>
      
      <Button
        size="sm"
        onClick={() => onNudge(0.1)}
        disabled={disabled}
      >
        +0.1s
      </Button>
      
      <Button
        size="sm"
        onClick={() => onNudge(0.5)}
        disabled={disabled}
      >
        +0.5s
      </Button>
    </div>
  );
};