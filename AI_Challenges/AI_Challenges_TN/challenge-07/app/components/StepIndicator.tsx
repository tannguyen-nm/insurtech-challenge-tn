'use client'

const STEPS = [
  'Claim Type',
  'Member Info',
  'Diagnosis',
  'Documents',
  'Review',
]

interface Props {
  currentStep: number
  onStepClick: (step: number) => void
}

export default function StepIndicator({ currentStep, onStepClick }: Props) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, i) => {
          const step = i + 1
          const completed = step < currentStep
          const active = step === currentStep
          const clickable = step < currentStep

          return (
            <div key={step} className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => clickable && onStepClick(step)}
                disabled={!clickable}
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  completed
                    ? 'bg-blue-600 border-blue-600 text-white cursor-pointer hover:bg-blue-700'
                    : active
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed',
                ].join(' ')}
                aria-label={`Step ${step}: ${label}`}
              >
                {completed ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </button>
              <span
                className={[
                  'mt-2 text-xs font-medium text-center hidden sm:block',
                  active ? 'text-blue-600' : completed ? 'text-gray-700' : 'text-gray-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
