import { motion } from "framer-motion";

const Redirecting = ({ message = "Redirecting..." }) => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center space-y-6"
            >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg overflow-hidden">
                    <img src="/logo.png" alt="Cortexa logo" className="w-full h-full object-contain scale-125" />
                </div>

                <p className="text-xl font-semibold text-emerald-400">
                    {message}
                </p>

                <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </motion.div>
        </div>
    );
};

export default Redirecting;
