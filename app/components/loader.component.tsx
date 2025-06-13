export const Loader = () => {
    return (
        <div className="absolute top-0 z-[9999] w-full h-screen flex justify-center items-center bg-white dark:bg-black">
            <div
                className="loader border-t-2 rounded-full border-gray-500 bg-gray-300 animate-spin
aspect-square w-8 flex justify-center items-center text-yellow-700"
            ></div>
        </div>
    )
}
