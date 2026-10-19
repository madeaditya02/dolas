export default function Loading() {
    // Or a custom loading skeleton component
    return (
        <div className='flex flex-1 space-x-2 w-full h-full justify-center items-center dark:invert'>
            <span className='sr-only'>Loading...</span>
            <div className='h-6 w-6 bg-primary-container rounded-full animate-bounce [animation-delay:-0.3s]'></div>
            <div className='h-6 w-6 bg-primary-container rounded-full animate-bounce [animation-delay:-0.15s]'></div>
            <div className='h-6 w-6 bg-primary-container rounded-full animate-bounce'></div>
        </div>
    )
}