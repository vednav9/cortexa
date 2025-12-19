import { motion } from "framer-motion";

const GreenParticles = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Soft gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-green-900/20 to-teal-900/20" />

            {/* Floating blobs */}
            <motion.div
                animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"
            />

            <motion.div
                animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/30 rounded-full blur-3xl"
            />

            <motion.div
                animate={{ x: [0, 25, 0], y: [0, 25, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
            />
        </div>
    );
};

export default GreenParticles;
