import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("FairRate Component Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ fontFamily: 'sans-serif' }}>
          <div className="bg-[#1a1a1a] text-white p-6 rounded-xl border border-red-500 max-w-md w-full shadow-2xl relative text-center space-y-4">
            <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
            <p className="text-sm text-gray-400">The FairRate interface crashed. This is usually caused by an unexpected layout change on IMDb.</p>
            <div className="bg-black/50 p-3 rounded text-xs font-mono text-left text-red-400 overflow-auto max-h-32">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => {
                if (this.props.onClose) this.props.onClose()
              }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md font-medium transition-colors w-full mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
