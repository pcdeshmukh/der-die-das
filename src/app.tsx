import { Header } from './components/Header';
import { getLevel } from './data';
import { route } from './lib/router';
import { DailyScreen } from './screens/DailyScreen';
import { GameScreen } from './screens/GameScreen';
import { Home } from './screens/Home';
import { LevelScreen } from './screens/LevelScreen';
import { NotFound } from './screens/NotFound';
import { Settings } from './screens/Settings';
import { TopicScreen } from './screens/TopicScreen';

function Screen({ parts }: { parts: string[] }) {
  if (parts.length === 0) return <Home />;
  if (parts.length === 1 && parts[0] === 'settings') return <Settings />;
  if (parts.length === 1 && parts[0] === 'daily') return <DailyScreen />;
  const level = getLevel(parts[0]);
  if (!level || level.topics.length === 0 || parts.length > 3) return <NotFound />;
  if (parts.length === 1) return <LevelScreen level={level} />;
  if (parts.length === 2) return <TopicScreen level={level} topicId={parts[1]} />;
  return <GameScreen key={parts.join('/')} level={level} topicId={parts[1]} modeId={parts[2]} />;
}

export function App() {
  const parts = route.value;
  const inGame = parts.length === 3 || parts[0] === 'daily';
  return (
    <div class={inGame ? 'app in-game' : 'app'}>
      {!inGame && <Header parts={parts} />}
      <main class="main">
        <Screen parts={parts} />
      </main>
    </div>
  );
}
