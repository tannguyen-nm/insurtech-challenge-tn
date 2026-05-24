import WizardForm from './components/WizardForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Papaya Insurance</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Claims Intake Wizard</h1>
          <p className="text-gray-500 text-sm mt-1">Complete all 5 steps to submit your insurance claim.</p>
        </div>

        <WizardForm />
      </div>
    </main>
  )
}
