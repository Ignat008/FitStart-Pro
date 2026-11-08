import { useEffect, useState } from 'react';
import SetupScreen from '@/components/SetupScreen';
import SessionScreen from '@/components/SessionScreen';
import SettingsModal from '@/components/SettingsModal';
import { generateWorkout, getApiKey } from '@/openrouter';
import type { SessionInput, WorkoutPlan } from '@/types';

type Screen = 'setup' | 'session';

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback');

  const refreshKey = () => setHasApiKey(!!getApiKey());

  useEffect(() => {
    refreshKey();
  }, []);

  const handleGenerate = async (input: SessionInput) => {
    setLoading(true);
    setPlan(null);
    const result = await generateWorkout(input);
    setPlan(result.plan);
    setSource(result.source);
    setLoading(false);
    setScreen('session');
  };

  const handleRestart = () => {
    setScreen('setup');
    setPlan(null);
    refreshKey();
  };

  return (
    <>
      {screen === 'setup' && (
        <SetupScreen
          onGenerate={handleGenerate}
          onOpenSettings={() => setSettingsOpen(true)}
          hasApiKey={hasApiKey}
          loading={loading}
        />
      )}
      {screen === 'session' && plan && (
        <SessionScreen
          plan={plan}
          source={source}
          onComplete={() => {}}
          onRestart={handleRestart}
        />
      )}
      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          refreshKey();
        }}
      />
    </>
  );
}

export default App;
