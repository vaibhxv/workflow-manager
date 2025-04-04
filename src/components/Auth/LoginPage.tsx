import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider 
} from 'firebase/auth';
import { auth } from '../../firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login, error, clearError, isAuthenticated, loading } = useAuth();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/workflows');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // The redirect will happen via the useEffect when isAuthenticated changes
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      clearError();
      const googleProvider = new GoogleAuthProvider();
      await signInWithPopup(auth, googleProvider);
      // Auth state listener in useAuth will handle the state update
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      clearError();
      const facebookProvider = new FacebookAuthProvider();
      await signInWithPopup(auth, facebookProvider);
      // Auth state listener in useAuth will handle the state update
    } catch (error) {
      console.error('Facebook login error:', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      clearError();
      const appleProvider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, appleProvider);
      // Auth state listener in useAuth will handle the state update
    } catch (error) {
      console.error('Apple login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1536147116438-62679a5e01f2?q=80')] bg-cover bg-center relative">
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-800/80 to-blue-900/80">
        {/* Logo and Left Content - Made responsive */}
        <div className="absolute lg:top-[25%] lg:left-[18%] md:top-[15%] md:left-[10%] top-8 left-4 p-4 md:p-8 lg:p-12">
          <div className="flex items-center text-white">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 mr-2" />
            <span className="text-xl md:text-2xl font-bold">HighBridge</span>
          </div>
        </div>
        
        {/* Hero Text - Made responsive */}
        <div className="absolute hidden md:block lg:left-36 md:left-16 lg:top-[50%] md:top-[40%] max-w-lg transform md:translate-y-[-50%]">
          <h1 className="text-3xl lg:text-4xl font-semibold text-center text-white">Building the Future...</h1>
          <div className="mt-6 p-4 text-center">
            <p className="text-white/80">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </div>
      
      {/* Login Form Card - Made responsive */}
      <div className="absolute bottom-0 md:right-12 lg:right-24 right-0 bg-white rounded-t-3xl md:rounded-t-3xl shadow-xl w-full max-w-full md:max-w-md p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide">WELCOME BACK!</h2>
          <h3 className="text-xl md:text-2xl font-bold mt-1">Log In to your Account</h3>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Type here..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Type here..."
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-red-600"
                />
                <label className="ml-2 text-sm text-gray-600">Remember me</label>
              </div>
              <a href="#" className="text-sm text-gray-600">Forgot Password?</a>
            </div>
            
            <button
              type="submit"
              className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:bg-red-300"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center my-2 md:my-4 px-4 py-2 border border-gray-50 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 mr-2" />
              Log In with Google
            </button>
            
            <button 
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center my-2 md:my-4 px-4 py-2 border border-gray-50 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="h-5 w-5 mr-2" />
              Log In with Facebook
            </button>
            
            <button 
              onClick={handleAppleLogin}
              className="w-full flex items-center justify-center px-4 py-2 my-2 md:my-4 border border-gray-50 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              <img src="https://www.apple.com/favicon.ico" alt="Apple" className="h-5 w-5 mr-2" />
              Log In with Apple
            </button>
          </div>
        </div>
        
        <p className="my-4 md:my-8 text-center text-sm text-gray-600">
          New User? <a href="/signup" className="font-bold text-gray-900">SIGN UP HERE</a>
        </p>
      </div>
    </div>
  );
}