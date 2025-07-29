import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">حدث خطأ غير متوقع</h2>
            <p className="text-gray-600 mb-6">
              نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة أو المحاولة مرة أخرى لاحقاً.
            </p>
            <Button onClick={this.handleReload} className="w-full">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة تحميل الصفحة
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

