import React, { useState } from 'react';
import { Lock, User, Store, ShieldCheck } from 'lucide-react';

interface LoginProps {
  type: 'supplier' | 'store';
  onLogin: (username: string, password: string) => void;
  error?: string;
  logo?: string | null;
}

const Login: React.FC<LoginProps> = ({ type, onLogin, error, logo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const isSupplier = type === 'supplier';

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="flex flex-col items-center mb-6">
          <div className={`p-4 rounded-full mb-4 bg-gray-100 text-black overflow-hidden border-2 border-primary`}>
            {logo ? (
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              isSupplier ? <ShieldCheck size={40} className="text-primary"/> : <Store size={40} className="text-primary"/>
            )}
          </div>
          <h2 className="text-2xl font-black text-black">
            {isSupplier ? 'ورود به پنل تامین کننده' : 'ورود به پنل فروشگاه'}
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-bold">
            {isSupplier ? 'لطفا رمز عبور مدیریتی را وارد کنید' : 'نام کاربری و رمز عبور فروشگاه را وارد کنید'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSupplier && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">نام کاربری</label>
              <div className="relative">
                <User className="absolute right-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all !text-black placeholder-gray-400 font-bold"
                  placeholder="نام کاربری فروشگاه"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all !text-black placeholder-gray-400 font-bold"
                placeholder="********"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-black">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-black text-lg shadow-lg transition-all bg-black hover:bg-gray-800 border-b-4 border-primary"
          >
            ورود به سیستم
          </button>
        </form>
        
        {isSupplier && (
           <div className="mt-4 text-center text-xs text-gray-400 font-bold">
             رمز عبور پیش‌فرض: admin
           </div>
        )}
      </div>
    </div>
  );
};

export default Login;