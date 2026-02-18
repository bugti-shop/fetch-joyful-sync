import { motion } from 'framer-motion';
import kaabaImage from '@/assets/kaaba-savings.png';
import { DuolingoButton } from '@/components/ui/duolingo-button';
import { hapticFeedback } from '@/lib/haptics';

interface WelcomeProps {
  onGetStarted: () => void;
}

export default function Welcome({ onGetStarted }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <img
            src={kaabaImage}
            alt="Hajj Savings Goal"
            className="w-[28rem] h-[28rem] object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold text-foreground">
            Start Your Savings Journey
          </h1>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full max-w-md"
      >
        <DuolingoButton
          variant="black"
          size="full"
          onClick={() => {
            hapticFeedback.medium();
            onGetStarted();
          }}
        >
          Get Started
        </DuolingoButton>
      </motion.div>
    </div>
  );
}
