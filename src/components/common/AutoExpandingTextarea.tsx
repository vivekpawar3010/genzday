import React, { useEffect, useRef } from 'react';

interface AutoExpandingTextareaProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const AutoExpandingTextarea: React.FC<AutoExpandingTextareaProps> = ({ 
  value, 
  onChange, 
  className, 
  placeholder, 
  onKeyDown 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  useEffect(() => { 
    adjustHeight(); 
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      rows={1}
      onKeyDown={onKeyDown}
      onInput={adjustHeight}
    />
  );
};
