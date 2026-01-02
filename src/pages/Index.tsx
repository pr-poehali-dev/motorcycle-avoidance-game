import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface Level {
  id: number;
  difficulty: Difficulty;
  reward: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
}

interface BikeCustomization {
  bodyColor: string;
  wheelColor: string;
  handlebarColor: string;
  hasHeadlights: boolean;
}

interface GameState {
  coins: number;
  eventCoins: number;
  currentLevel: number;
  levels: Level[];
  bikeCustomization: BikeCustomization;
  achievements: string[];
  dailyQuests: { id: string; title: string; progress: number; total: number; reward: number; completed: boolean }[];
  username: string;
  avatar: string;
  isLoggedIn: boolean;
}

const Index = () => {
  const [activeScreen, setActiveScreen] = useState<'menu' | 'game'>('menu');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [bikePosition, setBikePosition] = useState(50);
  const [obstacles, setObstacles] = useState<{ x: number; y: number; id: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(5);

  const [gameState, setGameState] = useState<GameState>({
    coins: 0,
    eventCoins: 0,
    currentLevel: 1,
    levels: Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      difficulty: i < 5 ? 'easy' : i < 10 ? 'medium' : i < 15 ? 'hard' : 'expert',
      reward: i < 5 ? 50 : i < 10 ? 75 : i < 15 ? 100 : 200,
      unlocked: i === 0,
      completed: false,
      stars: 0,
    })),
    bikeCustomization: {
      bodyColor: '#00ff41',
      wheelColor: '#ffffff',
      handlebarColor: '#9b87f5',
      hasHeadlights: false,
    },
    achievements: [],
    dailyQuests: [
      { id: '1', title: 'Пройди 3 уровня', progress: 0, total: 3, reward: 50, completed: false },
      { id: '2', title: 'Собери 100 монет', progress: 0, total: 100, reward: 50, completed: false },
      { id: '3', title: 'Уклонись от 50 препятствий', progress: 0, total: 50, reward: 50, completed: false },
    ],
    username: '',
    avatar: '🏍️',
    isLoggedIn: false,
  });

  const difficultyColors: Record<Difficulty, string> = {
    easy: 'from-green-500 to-emerald-400',
    medium: 'from-yellow-500 to-orange-400',
    hard: 'from-orange-500 to-red-500',
    expert: 'from-red-700 to-red-900',
  };

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
    expert: 'ЭКСПЕРТ',
  };

  useEffect(() => {
    if (!gameActive) return;

    const gameLoop = setInterval(() => {
      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({ ...obs, x: obs.x - gameSpeed }))
          .filter((obs) => obs.x > -50);

        if (Math.random() < 0.03) {
          updated.push({
            x: 800,
            y: Math.random() * 80 + 10,
            id: Date.now(),
          });
        }

        updated.forEach((obs) => {
          if (
            obs.x < 150 &&
            obs.x > 50 &&
            Math.abs(obs.y - bikePosition) < 10
          ) {
            endGame(false);
          }
        });

        return updated;
      });

      setScore((prev) => prev + 1);
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameActive, bikePosition, gameSpeed]);

  useEffect(() => {
    if (!gameActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setBikePosition((prev) => Math.max(10, prev - 5));
      } else if (e.key === 'ArrowDown') {
        setBikePosition((prev) => Math.min(90, prev + 5));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameActive]);

  const startLevel = (levelId: number) => {
    const level = gameState.levels.find((l) => l.id === levelId);
    if (!level || !level.unlocked) return;

    setGameState((prev) => ({ ...prev, currentLevel: levelId }));
    setActiveScreen('game');
    setGameActive(true);
    setObstacles([]);
    setScore(0);
    
    const difficultySpeed: Record<Difficulty, number> = {
      easy: 4,
      medium: 6,
      hard: 8,
      expert: 10,
    };
    setGameSpeed(difficultySpeed[level.difficulty]);
  };

  const endGame = (won: boolean) => {
    setGameActive(false);
    
    if (won) {
      const level = gameState.levels[gameState.currentLevel - 1];
      setGameState((prev) => {
        const updatedLevels = [...prev.levels];
        updatedLevels[gameState.currentLevel - 1].completed = true;
        updatedLevels[gameState.currentLevel - 1].stars = 3;
        
        if (gameState.currentLevel < 16) {
          updatedLevels[gameState.currentLevel].unlocked = true;
        }

        return {
          ...prev,
          coins: prev.coins + level.reward,
          levels: updatedLevels,
        };
      });
    }
    
    setTimeout(() => setActiveScreen('menu'), 2000);
  };

  const purchaseCustomTheme = () => {
    if (gameState.coins >= 1000) {
      setGameState((prev) => ({ ...prev, coins: prev.coins - 1000 }));
      setShowColorPicker(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="cyber-card">
          <DialogHeader>
            <DialogTitle className="neon-text text-2xl">
              {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Имя пользователя</Label>
              <Input className="bg-black/50 border-neon-green" />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input type="password" className="bg-black/50 border-neon-green" />
            </div>
            <Button
              className="w-full neon-glow bg-neon-green text-black hover:bg-neon-green/80"
              onClick={() => {
                setGameState((prev) => ({
                  ...prev,
                  isLoggedIn: true,
                  username: 'Игрок #' + Math.floor(Math.random() * 9999),
                }));
                setShowAuth(false);
              }}
            >
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-neon-green"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              {authMode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="cyber-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="neon-text text-2xl">Кастомизация мотоцикла</DialogTitle>
            <DialogDescription>RGB настройка цветов</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Цвет корпуса</Label>
              <div className="flex gap-4 items-center mt-2">
                <Input
                  type="color"
                  value={gameState.bikeCustomization.bodyColor}
                  onChange={(e) =>
                    setGameState((prev) => ({
                      ...prev,
                      bikeCustomization: { ...prev.bikeCustomization, bodyColor: e.target.value },
                    }))
                  }
                  className="w-20 h-12"
                />
                <span className="text-sm">{gameState.bikeCustomization.bodyColor}</span>
              </div>
            </div>
            <div>
              <Label>Цвет колес</Label>
              <div className="flex gap-4 items-center mt-2">
                <Input
                  type="color"
                  value={gameState.bikeCustomization.wheelColor}
                  onChange={(e) =>
                    setGameState((prev) => ({
                      ...prev,
                      bikeCustomization: { ...prev.bikeCustomization, wheelColor: e.target.value },
                    }))
                  }
                  className="w-20 h-12"
                />
                <span className="text-sm">{gameState.bikeCustomization.wheelColor}</span>
              </div>
            </div>
            <div>
              <Label>Цвет руля</Label>
              <div className="flex gap-4 items-center mt-2">
                <Input
                  type="color"
                  value={gameState.bikeCustomization.handlebarColor}
                  onChange={(e) =>
                    setGameState((prev) => ({
                      ...prev,
                      bikeCustomization: { ...prev.bikeCustomization, handlebarColor: e.target.value },
                    }))
                  }
                  className="w-20 h-12"
                />
                <span className="text-sm">{gameState.bikeCustomization.handlebarColor}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="headlights"
                checked={gameState.bikeCustomization.hasHeadlights}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    bikeCustomization: { ...prev.bikeCustomization, hasHeadlights: e.target.checked },
                  }))
                }
                className="w-4 h-4"
              />
              <Label htmlFor="headlights">Включить фары</Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {activeScreen === 'game' && (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
          <div className="absolute top-4 left-4 z-10 space-y-2">
            <div className="cyber-card px-4 py-2">
              <span className="neon-text text-xl font-bold">Уровень {gameState.currentLevel}</span>
            </div>
            <div className="cyber-card px-4 py-2">
              <span className="text-neon-green text-lg">Счет: {score}</span>
            </div>
          </div>

          {!gameActive && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
              <Card className="cyber-card p-8 text-center pulse-glow">
                <h2 className="neon-text text-4xl font-bold mb-4">
                  {score > 1000 ? 'Уровень пройден!' : 'Попробуй снова!'}
                </h2>
                {score > 1000 && (
                  <p className="text-neon-green text-2xl">
                    +{gameState.levels[gameState.currentLevel - 1].reward} монет
                  </p>
                )}
              </Card>
            </div>
          )}

          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-20 bg-white opacity-50"
                style={{
                  top: `${50}%`,
                  left: `${i * 25}%`,
                  animation: `roadMove ${2 / gameSpeed}s linear infinite`,
                }}
              />
            ))}
          </div>

          <div
            className="absolute left-[100px] transition-all duration-100"
            style={{ top: `${bikePosition}%`, transform: 'translateY(-50%)' }}
          >
            <div className="relative">
              <div
                className="w-16 h-8 rounded-lg neon-glow"
                style={{ backgroundColor: gameState.bikeCustomization.bodyColor }}
              >
                <div
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{ backgroundColor: gameState.bikeCustomization.wheelColor }}
                />
                <div
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{ backgroundColor: gameState.bikeCustomization.wheelColor }}
                />
                {gameState.bikeCustomization.hasHeadlights && (
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-2 bg-yellow-300 opacity-70 blur-sm" />
                )}
              </div>
            </div>
          </div>

          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute w-8 h-8 bg-red-500 neon-glow rounded"
              style={{
                left: `${obs.x}px`,
                top: `${obs.y}%`,
                transform: 'translateY(-50%)',
              }}
            >
              ⚠️
            </div>
          ))}

          {score > 500 && (
            <Button
              className="absolute bottom-4 right-4 bg-neon-green text-black neon-glow"
              onClick={() => endGame(true)}
            >
              Завершить уровень
            </Button>
          )}

          <style>{`
            @keyframes roadMove {
              from { transform: translateX(0); }
              to { transform: translateX(-100%); }
            }
          `}</style>
        </div>
      )}

      {activeScreen === 'menu' && (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold neon-text mb-4 pulse-glow">
              МОТОЦИКЛ
            </h1>
            <p className="text-2xl neon-text">Избегай препятствия!</p>
          </div>

          <div className="flex justify-center gap-6 mb-8">
            <Card className="cyber-card px-6 py-3 flex items-center gap-2">
              <Icon name="Coins" className="text-yellow-400" />
              <span className="text-xl font-bold">{gameState.coins}</span>
            </Card>
            <Card className="cyber-card px-6 py-3 flex items-center gap-2">
              <Icon name="Gem" className="text-purple-400" />
              <span className="text-xl font-bold">{gameState.eventCoins}</span>
            </Card>
            {!gameState.isLoggedIn && (
              <Button
                onClick={() => setShowAuth(true)}
                className="bg-neon-green text-black neon-glow hover:bg-neon-green/80"
              >
                <Icon name="User" className="mr-2" />
                Войти
              </Button>
            )}
          </div>

          <Tabs defaultValue="levels" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-8 cyber-card">
              <TabsTrigger value="levels" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                Уровни
              </TabsTrigger>
              <TabsTrigger value="shop" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                Магазин
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                События
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                Профиль
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                Достижения
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                Задания
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
                Настройки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="levels">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {gameState.levels.map((level) => (
                  <Card
                    key={level.id}
                    className={`cyber-card p-6 cursor-pointer transition-all hover:scale-105 ${
                      !level.unlocked ? 'opacity-50' : ''
                    } ${level.completed ? 'neon-glow' : ''}`}
                    onClick={() => level.unlocked && startLevel(level.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold neon-text">#{level.id}</h3>
                      {level.unlocked ? (
                        <Icon name="Unlock" className="text-neon-green" />
                      ) : (
                        <Icon name="Lock" className="text-gray-500" />
                      )}
                    </div>
                    <Badge
                      className={`mb-3 bg-gradient-to-r ${difficultyColors[level.difficulty]} border-0`}
                    >
                      {difficultyLabels[level.difficulty]}
                    </Badge>
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Icon name="Coins" size={20} />
                      <span className="font-bold">+{level.reward}</span>
                    </div>
                    {level.completed && (
                      <div className="flex gap-1 mt-3">
                        {[...Array(level.stars)].map((_, i) => (
                          <Icon key={i} name="Star" className="text-yellow-400 fill-yellow-400" size={20} />
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shop">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cyber-card p-6">
                  <h3 className="text-xl font-bold neon-text mb-4">Кастомная тема</h3>
                  <p className="text-gray-400 mb-4">RGB настройка цветов мотоцикла</p>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Coins" className="text-yellow-400" />
                    <span className="text-2xl font-bold">1000</span>
                  </div>
                  <Button
                    className="w-full bg-neon-green text-black neon-glow hover:bg-neon-green/80"
                    onClick={purchaseCustomTheme}
                    disabled={gameState.coins < 1000}
                  >
                    Купить
                  </Button>
                </Card>

                <Card className="cyber-card p-6">
                  <h3 className="text-xl font-bold neon-text mb-4">Скин: Неоновый</h3>
                  <p className="text-gray-400 mb-4">Светящийся неоновый дизайн</p>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Coins" className="text-yellow-400" />
                    <span className="text-2xl font-bold">500</span>
                  </div>
                  <Button className="w-full bg-neon-green text-black neon-glow hover:bg-neon-green/80">
                    Купить
                  </Button>
                </Card>

                <Card className="cyber-card p-6">
                  <h3 className="text-xl font-bold neon-text mb-4">Улучшение: Скорость</h3>
                  <p className="text-gray-400 mb-4">Увеличение базовой скорости</p>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Coins" className="text-yellow-400" />
                    <span className="text-2xl font-bold">300</span>
                  </div>
                  <Button className="w-full bg-neon-green text-black neon-glow hover:bg-neon-green/80">
                    Купить
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events">
              <Card className="cyber-card p-8">
                <h2 className="text-3xl font-bold neon-text mb-6">Сезонные события</h2>
                <div className="space-y-4">
                  <Card className="cyber-card p-6 neon-glow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold neon-text mb-2">Зимний турнир</h3>
                        <p className="text-gray-400">Пройди 10 уровней за неделю</p>
                      </div>
                      <Badge className="bg-neon-purple">Активно</Badge>
                    </div>
                    <Progress value={40} className="mb-4" />
                    <div className="flex items-center gap-2 text-purple-400">
                      <Icon name="Gem" size={20} />
                      <span className="font-bold">Награда: 500 Эвент коинов</span>
                    </div>
                  </Card>

                  <Card className="cyber-card p-6 opacity-60">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Весенний марафон</h3>
                        <p className="text-gray-500">Скоро...</p>
                      </div>
                      <Badge variant="outline">Скоро</Badge>
                    </div>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              {gameState.isLoggedIn ? (
                <Card className="cyber-card p-8">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-green to-neon-purple flex items-center justify-center text-5xl neon-glow">
                      {gameState.avatar}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold neon-text mb-2">{gameState.username}</h2>
                      <p className="text-gray-400">Уровень: {gameState.levels.filter(l => l.completed).length}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="cyber-card p-4">
                      <p className="text-gray-400 mb-2">Пройдено уровней</p>
                      <p className="text-3xl font-bold neon-text">{gameState.levels.filter(l => l.completed).length}</p>
                    </Card>
                    <Card className="cyber-card p-4">
                      <p className="text-gray-400 mb-2">Всего монет</p>
                      <p className="text-3xl font-bold text-yellow-400">{gameState.coins}</p>
                    </Card>
                    <Card className="cyber-card p-4">
                      <p className="text-gray-400 mb-2">Достижения</p>
                      <p className="text-3xl font-bold text-purple-400">{gameState.achievements.length}</p>
                    </Card>
                  </div>
                  <div className="space-y-4">
                    <Button className="w-full bg-neon-green text-black neon-glow hover:bg-neon-green/80">
                      Изменить имя
                    </Button>
                    <Button className="w-full bg-neon-purple text-white neon-glow hover:bg-neon-purple/80">
                      Изменить аватар
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="cyber-card p-8 text-center">
                  <Icon name="User" className="mx-auto mb-4 text-neon-green" size={64} />
                  <h2 className="text-2xl font-bold neon-text mb-4">Войдите в аккаунт</h2>
                  <p className="text-gray-400 mb-6">Сохраняйте прогресс и соревнуйтесь с друзьями</p>
                  <Button
                    onClick={() => setShowAuth(true)}
                    className="bg-neon-green text-black neon-glow hover:bg-neon-green/80"
                  >
                    Войти / Регистрация
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: 'Trophy', title: 'Первый шаг', desc: 'Пройди первый уровень', unlocked: true },
                  { icon: 'Zap', title: 'Скоростной', desc: 'Пройди уровень за 30 секунд', unlocked: false },
                  { icon: 'Shield', title: 'Неуязвимый', desc: 'Пройди уровень без столкновений', unlocked: false },
                  { icon: 'Star', title: 'Перфекционист', desc: 'Собери все звезды на легких уровнях', unlocked: false },
                  { icon: 'Target', title: 'Мастер уклонений', desc: 'Уклонись от 1000 препятствий', unlocked: false },
                  { icon: 'Crown', title: 'Легенда', desc: 'Пройди все уровни на Эксперт', unlocked: false },
                ].map((achievement, i) => (
                  <Card
                    key={i}
                    className={`cyber-card p-6 ${achievement.unlocked ? 'neon-glow' : 'opacity-50'}`}
                  >
                    <Icon
                      name={achievement.icon as any}
                      className={`mb-4 ${achievement.unlocked ? 'text-neon-green' : 'text-gray-500'}`}
                      size={48}
                    />
                    <h3 className="text-xl font-bold neon-text mb-2">{achievement.title}</h3>
                    <p className="text-gray-400">{achievement.desc}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quests">
              <Card className="cyber-card p-8">
                <h2 className="text-3xl font-bold neon-text mb-6">Ежедневные задания</h2>
                <div className="space-y-4">
                  {gameState.dailyQuests.map((quest) => (
                    <Card key={quest.id} className="cyber-card p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold neon-text mb-2">{quest.title}</h3>
                          <p className="text-gray-400 mb-2">
                            Прогресс: {quest.progress}/{quest.total}
                          </p>
                          <Progress value={(quest.progress / quest.total) * 100} className="mb-2" />
                        </div>
                        <div className="flex items-center gap-2 text-yellow-400 ml-4">
                          <Icon name="Coins" size={20} />
                          <span className="font-bold">+{quest.reward}</span>
                        </div>
                      </div>
                      {quest.completed && (
                        <Badge className="bg-neon-green text-black">Выполнено</Badge>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="cyber-card p-8">
                <h2 className="text-3xl font-bold neon-text mb-6">Настройки</h2>
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg mb-2 block">Громкость музыки</Label>
                    <Slider defaultValue={[70]} max={100} step={1} />
                  </div>
                  <div>
                    <Label className="text-lg mb-2 block">Громкость эффектов</Label>
                    <Slider defaultValue={[80]} max={100} step={1} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="vibration" defaultChecked className="w-4 h-4" />
                    <Label htmlFor="vibration">Вибрация</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="particles" defaultChecked className="w-4 h-4" />
                    <Label htmlFor="particles">Эффекты частиц</Label>
                  </div>
                  <div>
                    <Label className="text-lg mb-2 block">Управление фарами мотоцикла</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="headlights-setting"
                        checked={gameState.bikeCustomization.hasHeadlights}
                        onChange={(e) =>
                          setGameState((prev) => ({
                            ...prev,
                            bikeCustomization: {
                              ...prev.bikeCustomization,
                              hasHeadlights: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor="headlights-setting">Включить фары</Label>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Index;
