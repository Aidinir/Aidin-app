import React, { useState, useEffect } from 'react';
import { getPersianDate, getPersianTime } from '../services/dateService';
import { Armchair } from 'lucide-react';

interface HeaderProps {
  logo?: string | null;
}

const Header: React.FC<HeaderProps> = ({ logo }) => {
  const [time, setTime] = useState<string>(getPersianTime());
  const [date, setDate] = useState<string>(getPersianDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getPersianTime());
      setDate(getPersianDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20 h-20 border-b-4 border-primary">
      <div className="w-1/3 invisible hidden md:block"></div>

      <div className="flex items-center justify-center w-full md:w-1/3">
        {logo ? (
          <img src={logo} alt="Logo" className="h-16 w-auto object-contain rounded-md" />
        ) : (
          <Armchair size={48} strokeWidth={2} className="text-primary" />
        )}
      </div>

      <div className="w-full md:w-1/3 flex flex-col items-end justify-center text-black text-sm md:text-base pl-2">
        <div className="font-bold text-gray-800">{date}</div>
        <div className="font-mono text-primary font-black text-xl" dir="ltr">{time}</div>
      </div>
    </header>
  );
};

export default Header;