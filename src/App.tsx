import { useEffect, useState } from 'react';
import SetupScreen from '@/components/SetupScreen';
import SessionScreen from '@/components/SessionScreen';
import SettingsModal from '@/components/SettingsModal';
import { generateWorkout, getApiKey } from '@/openrouter';
import type { SessionInput, WorkoutPlan } from '@/types';
import { loadProfile, saveProfile, awardXp, type UserProfile } from '@/gamification';
import { UserProfile as UserProfileCard } from '@/components/UserProfile';
import { LevelUpModal } from '@/components/LevelUpModal';
import { ChallengesWidget } from '@/components/ChallengesWidget';
import AppearanceScreen from '@/components/AppearanceScreen';
import {
  applyAppearance,
  loadAppearance,
  saveAppearance,
  type AppearanceSettings,
} from '@/appearance';
import MusicPlayer from '@/components/MusicPlayer';

type Screen = 'setup' | 'session';
type Tab = 'workout' | 'appearance';

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback');
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [appearance, setAppearance] = useState<AppearanceSettings>(loadAppearance);
  const [levelUp, setLevelUp] = useState<{
    open: boolean;
    oldLevel: number;
    newLevel: number;
    profile: UserProfile;
    xpEarned: number;
  } | null>(null);

  const refreshKey = () => setHasApiKey(!!getApiKey());

  useEffect(() => {
    refreshKey();
  }, []);

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

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
    setActiveTab('workout');
    setPlan(null);
    refreshKey();
  };

  const handleAppearanceChange = (nextAppearance: AppearanceSettings) => {
    setAppearance(nextAppearance);
    saveAppearance(nextAppearance);
  };

  const handleFinish = (
    xpEarned: number,
    streakProfile: UserProfile,
    challengeBonusXp: number,
    challengeRewardTitle?: string,
  ) => {
    const { profile: newProfile, leveledUp } = awardXp(streakProfile, xpEarned);
    setProfile(newProfile);
    saveProfile(newProfile);

    if (challengeBonusXp > 0 && challengeRewardTitle) {
      // Звання буде відображено в LevelUpModal або повідомленні
      // Тут можна додати додаткову логіку при потребі
    }

    if (leveledUp) {
      setLevelUp({
        open: true,
        oldLevel: profile.level,
        newLevel: newProfile.level,
        profile: newProfile,
        xpEarned,
      });
    }
  };

  const handleCloseLevelUp = () => {
    setLevelUp(null);
  };

  return (
    <>
      {screen === 'setup' && (
        <>
          <div className={activeTab === 'workout' ? '' : 'hidden'}>
            <div className="relative z-10 mb-4">
              <UserProfileCard profile={profile} activeDays={profile.workoutDates} compact />
            </div>
            <ChallengesWidget />
            <SetupScreen
              onGenerate={handleGenerate}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenAppearance={() => setActiveTab('appearance')}
              hasApiKey={hasApiKey}
              loading={loading}
            />
          </div>
          {activeTab === 'appearance' && (
            <AppearanceScreen
              appearance={appearance}
              onChange={handleAppearanceChange}
              onBack={() => setActiveTab('workout')}
            />
          )}
        </>
      )}
      {screen === 'session' && plan && (
        <SessionScreen
          plan={plan}
          source={source}
          profile={profile}
          activeDays={profile.workoutDates}
          onComplete={(xpEarned: number, streakProfile: UserProfile, challengeBonusXp: number, challengeRewardTitle?: string) => {
            handleFinish(xpEarned, streakProfile, challengeBonusXp, challengeRewardTitle);
          }}
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
      {levelUp && (
        <LevelUpModal
          open={levelUp.open}
          onClose={handleCloseLevelUp}
          oldLevel={levelUp.oldLevel}
          newLevel={levelUp.newLevel}
          profile={levelUp.profile}
          xpEarned={levelUp.xpEarned}
        />
      )}
      <MusicPlayer />
    </>
  );
}

export default App;
