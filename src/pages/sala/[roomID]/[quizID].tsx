import { GetServerSideProps } from 'next';
import { useRouter } from 'next/dist/client/router';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiLink, FiShare2 } from 'react-icons/fi'

import { Question, Room, Team, User } from '../../../interfaces/entitiesInterfaces';
import { LocalDatabase } from '../../../services/localDatabase';

import getSocket from './../../../services/getSocket'

import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';

import styles from './styles.module.scss';
import { constants } from '../../../util/contants';

import { TimeBar } from '../../../components/TimerBar';
import { useInterval } from '../../../hooks/useInterval';

const socket = getSocket('room');

interface TeamOption {
    [username: string]: {
        teamID: number;
        user: User
    };
}

interface GamePoints {
    [teamID: string]: number;
}

interface TeamsMap {
    [teamID: number]: Team
}

interface RoomPageProps {
    timeToAnswer: number;
}

export default function RoomPage({ timeToAnswer }: RoomPageProps) {
    const [isOwner, setIsOwner] = useState(false);
    const [username, setUsername] = useState('');
    const [myUser, setMyUser] = useState<User>();
    const [room, setRoom] = useState<Room>();
    const [joinedOnRoom, setJoinedOnRoom] = useState(false);
    const [isMyUserSet, setIsMyUserSet] = useState(false);
    const [choicedTeams, setChoicedTeams] = useState<TeamOption>({});
    const [myTeam, setMyTeam] = useState('');

    const [timeLeftToAnswer, setTimeLeftToAnswer] = useState(timeToAnswer);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const [gameStarted, setGameStarted] = useState(false);
    const [teams, setTeams] = useState<TeamsMap>();
    const [currentTeam, setCurrentTeam] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState<Question>();
    const [currentQuestionPosition, setCurrentQuestionPosition] = useState<number>();
    const [questionsQuantity, setQuestionsQuantity] = useState<number>();
    const [gamePoints, setGamePoints] = useState<GamePoints>({});
    const [answerOptionChoiced, setAnswerOptionChoiced] = useState('');
    const [waitingNextQuestion, setWaitingNextQuestion] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);
    const [winners, setWinners] = useState<Team[]>([]);

    const router = useRouter();

    useInterval(
        () => {
            setTimeLeftToAnswer(oldValue => oldValue - 1)
        },
        isTimerRunning ? 1000 : null
    );

    const { roomID, quizID } = router.query;

    useEffect(() => {
        const storagedRoom = LocalDatabase.getRoom(String(roomID));
        console.log('Storaged Room', storagedRoom);
        if(storagedRoom) {
            setRoom(oldData => ({
                ...oldData,
                ...storagedRoom
            }));
            setIsOwner(!!storagedRoom);
        }

        const userStoraged = LocalDatabase.getUser();
        console.log('Storaged user', userStoraged);             
        if(userStoraged) {
            setUsername(userStoraged.username);
            setMyUser(userStoraged);
            // setIsMyUserSet(true);

            // if(!joinedOnRoom) {
            //     socket.emit(constants.events.JOIN_ROOM, {
            //         user: {
            //             username: userStoraged.username
            //         },
            //         room: {
            //             roomID,
            //             quizID
            //         }
            //     });
            //     setJoinedOnRoom(true);
            // } 
        }
    }, []);

    useEffect(() => {
        socket.on(constants.events.NEW_USER_ON_ROOM, ({ room, user }) => {
            console.log('New user on Room', user);
            console.log('Room updated', room);
            setRoom(room);
        });

        socket.on(constants.events.USER_DISCONNECTED, ({ room, user }) => {
            console.log('User disconnected', user);
            console.log('Room updated', room);
            setRoom(room);

            // Verificar se sou o novo dono da sala
            const storagedUser = LocalDatabase.getUser();
            if(room.owner.username === storagedUser.username)
                setIsOwner(true);
        });

        socket.on(constants.events.GAME_STARTED, ({ teams, points, room, questionsQuantity }: { teams: TeamsMap, points: GamePoints, room: Room, questionsQuantity: number }) => {
            console.log('Game started', teams);
            console.log('Teams values', Object.values(teams));
            console.log('Room data', room);

            const storagedUser = LocalDatabase.getUser();
            
            setGameFinished(false);
            setGameStarted(true);
            setTeams(teams);
            setGamePoints(points);
            setRoom(room);
            setIsOwner(room.owner.username === storagedUser.username);
            setQuestionsQuantity(questionsQuantity);

            for (const teamID in teams) {
                const users = teams[teamID].members;
                const isMyTeam = users.some((user: User) => user.username === storagedUser.username);
                if(isMyTeam) setMyTeam(teamID);
            }
        });

        socket.on(constants.events.NEXT_QUESTION, ({
            currentQuestion,
            currentTeam,
            questionPosition
          }) => {
            console.log('New question', currentQuestion);
            setCurrentQuestion(currentQuestion);
            setCurrentTeam(currentTeam);
            setWaitingNextQuestion(false);
            setCurrentQuestionPosition(questionPosition);

            setIsTimerRunning(true);
            setTimeLeftToAnswer(timeToAnswer);
          });

        socket.on(constants.events.ANSWER_RESULT, ({ isRight, points }) => {
            isRight ? toast.success('Acertou mizeravi!') : toast.error('Erouuu!');

            setIsTimerRunning(false);
            setTimeLeftToAnswer(timeToAnswer);
            
            setGamePoints(points);
        });

        socket.on(constants.events.GAME_FINISHED, ({ teams, points }) => {
            toast.success('O jogo acabou!');
            console.log('O jogo acabou');

            setGameFinished(true);
            setCurrentQuestion(null);

            setIsTimerRunning(false);
            setTimeLeftToAnswer(timeToAnswer);

            const winnerData = Object.keys(teams).reduce((winnerData, teamID) => {
                const currentTeam = teams[teamID];
                const currentTeamPoints = points[teamID];
                if(currentTeamPoints < winnerData.maxPoint) return winnerData;

                if(currentTeamPoints > winnerData.maxPoint) {
                    winnerData.winners = [currentTeam];
                    winnerData.maxPoint = currentTeamPoints;
                } else {
                    winnerData.winners.push(currentTeam);
                }

                return winnerData;
            }, { winners: [], maxPoint: 0 });

            setWinners(winnerData.winners);
        });
    }, []);

    useEffect(() => {
        if(timeLeftToAnswer > 0) return;

        setIsTimerRunning(false);
        toast.error('Tempo esgotado.');

        // Solicitar nova pergunta se meu time for o corrente
        if(myTeam === currentTeam) requestNextQuestion();
    }, [timeLeftToAnswer]);

    function handleJoinRoomFormSubmit(event: FormEvent) {
        event.preventDefault();

        if(!username) 
            return toast.error('Preencha seu nome de usuário!');

        const myUserData = {
            username: username
        }

        setIsMyUserSet(true);
        setMyUser(myUserData);

        LocalDatabase.saveUser(myUserData);

        socket.emit(constants.events.JOIN_ROOM, {
            user: myUserData,
            room: {
                roomID,
                quizID
            }
        });
        setJoinedOnRoom(true);
    }

    function handleTeamOptionChanged(teamID: number, user: User) {
        const currentTeams = {...choicedTeams};
        currentTeams[user.username] = { teamID, user };
        setChoicedTeams(currentTeams);

        // TODO: sincronizar alterações de time (refletir em todas as telas)
    }

    function handleClickStartGameButton() {
        const designatedUsers = [];
        const teamsData: TeamsMap = {};
        for (const username in choicedTeams) {
            const teamData = choicedTeams[username];
            const { teamID } = teamData;
            if(!teamsData[teamID]) {
                teamsData[teamID] = {
                    teamID: teamID,
                    position: teamID,
                    name: `Time #${teamID}`,
                    members: [teamData.user]
                };
            } else {
                teamsData[teamID].members.push(teamData.user)
            }
            designatedUsers.push(username);
        }

        // Verificar se há no mímino 2 times com usuários
        if(Object.keys(teamsData).length < 2) {
            alert('Designe usuários em pelo menos 2 salas diferentes.');
            return;
        }

        // Verificar se todos foram atribuidos
        if(room.users.length !== designatedUsers.length) {
            alert('Designe todos usuários em alguma sala.')
            return;
        }

        const storagedRoom = LocalDatabase.getRoom(String(roomID));

        socket.emit(constants.events.START_GAME, {
            roomID, 
            teams: teamsData,
            room: {
                name: storagedRoom.name,
                ...room,
            }
        });
    }

    function handleClickAnswerQuestionButton() {
        console.log('Respondendo pergunta...');

        socket.emit(constants.events.QUESTION_ANSWERED, {
            roomID, 
            choicedOptionID: answerOptionChoiced
        });

        setAnswerOptionChoiced('');
        setWaitingNextQuestion(true);
    }

    function requestNextQuestion() {
        socket.emit(constants.events.NEXT_QUESTION_REQUEST, {
            roomID
        });
    }

    function handleClickRestartGameButton() {
        socket.emit(constants.events.RESTART_GAME, {
            roomID,
            teams,
            room
        })
    }

    function shareRoomLink() {
        navigator.share({
            url: router.asPath,
            text: 'Vamos jogar uma partida? 😁',
            title: room.name
        });
    }

    return (
        <>
            <TimeBar 
                    totalTime={timeToAnswer}
                    timeLeft={timeLeftToAnswer}
                />
            <div className={styles.container}>
                {!isMyUserSet ? (
                    <form onSubmit={handleJoinRoomFormSubmit}>
                        <Input
                            id="username"
                            label="Informe seu nome de usuário"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                        <div className={styles.submitButton}>
                            <Button>Ingressar</Button>
                        </div>
                    </form>
                ) : (
                    !gameStarted ? (
                        <div className={styles.userOnRoomList}>
                            <h2>Lista de usuários na sala</h2>
                            <ul>
                                {room && room.users && room.users.map((user: User) => (
                                    <li key={user.username}>
                                        <span>{user.username}</span>
                                        <div>
                                            <label htmlFor={`team-1-${user.username}`}>
                                                Time 01
                                                <input
                                                    type="radio" 
                                                    name={`team-${user.username}`}
                                                    id={`team-1-${user.username}`}
                                                    value={1} 
                                                    disabled={!isOwner}
                                                    onChange={(event) => handleTeamOptionChanged(Number(event.target.value), user)}
                                                    checked={choicedTeams[user.username]?.teamID === 1}
                                                />
                                            </label>
                                            <label htmlFor={`team-2-${user.username}`}>
                                                Time 02
                                                <input 
                                                    type="radio" 
                                                    name={`team-${user.username}`}
                                                    id={`team-2-${user.username}`}
                                                    value={2}
                                                    disabled={!isOwner}
                                                    onChange={(event) => handleTeamOptionChanged(Number(event.target.value), user)}
                                                    checked={choicedTeams[user.username]?.teamID === 2}
                                                />
                                            </label>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {isOwner && (
                                <>
                                    <div className={styles.submitButton}>
                                        <Button onClick={handleClickStartGameButton}>Iniciar jogo</Button>
                                    </div>
                                    <div className={styles.submitButton}>
                                        <Button onClick={shareRoomLink}><FiShare2 />Compartilhar link da sala</Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={styles.game}>
                            <div className={styles.pontuation}>
                                {gamePoints && Object.keys(gamePoints).map((teamID: string) => (
                                    <div key={teamID} className={currentTeam === teamID ? `${styles.item} ${styles.currentTeam}` : styles.item}>
                                        <span>{teams[Number(teamID)].name}</span>
                                        <strong>{gamePoints[teamID]}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.gameContent}>
                                {gameFinished ? (
                                    <div className={styles.gameFinished}>
                                        <span>{winners.length > 1 ? 'Empate! Os vencedores foram' : 'O vencedor foi'}</span>
                                        {winners.map(winner => <strong key={winner.teamID}>{winner.name}</strong>)}
                                        <Button 
                                            disabled={!isOwner}
                                            onClick={handleClickRestartGameButton}>
                                            Jogar outra partida
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {!currentQuestion ? (
                                            <p>Esperando a primeira pergunta...</p>
                                        ) : (
                                            <div className={styles.question}>
                                                <h3>Pergunta ({currentQuestionPosition} / {questionsQuantity}): {currentQuestion.question}</h3>
                                                <ul>
                                                    {currentQuestion.options.map(option => (
                                                        <li key={option.id}>
                                                            <label htmlFor={`question-${option.id}`}>
                                                                <input
                                                                    type="radio" 
                                                                    value={option.id} 
                                                                    name={`question`} 
                                                                    id={`question-${option.id}`}
                                                                    checked={answerOptionChoiced === option.id}
                                                                    onChange={() => setAnswerOptionChoiced(option.id)}
                                                                    disabled={currentTeam !== myTeam}
                                                                /> {option.value}
                                                            </label>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {waitingNextQuestion && currentQuestion.reference && (
                                                    <a 
                                                        href={currentQuestion.reference}
                                                        className={styles.reference}
                                                        target="_blank"
                                                    >Referência da resposta <FiLink /></a>
                                                )}
                                                <div className={styles.submitButton}>
                                                    {(currentTeam === myTeam) && !waitingNextQuestion && (
                                                        <Button
                                                            onClick={handleClickAnswerQuestionButton}
                                                        > Responder
                                                        </Button>
                                                    )}
                                                    {waitingNextQuestion && (
                                                        <Button
                                                            onClick={requestNextQuestion}
                                                        > Próxima pergunta
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className={styles.teams}>
                                    {teams && Object.values(teams).map((team: Team) => (
                                        <div key={team.teamID} className={styles.team}>
                                            <h4>{team.name} {Number(myTeam) === team.teamID ? '(Meu time)' : ''}</h4>
                                            {team.members.map((user: User) => (
                                                <span key={user.username}>{user.username}</span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params, query, resolvedUrl }) => {
    return {
        props: {
            timeToAnswer: query.timeToAnswer ?? 30
        }
    }
}
