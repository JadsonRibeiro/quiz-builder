import { GetServerSideProps } from 'next';
import { useRouter } from 'next/dist/client/router';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiLink, FiShare2, FiX } from 'react-icons/fi'
import PeerJS from "peerjs"

import { Question, Room, Team, User } from '../../../interfaces/entitiesInterfaces';
import { LocalDatabase } from '../../../services/localDatabase';

import getSocket from './../../../services/getSocket'

import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { TimeBar } from '../../../components/TimerBar';
import { OptionButton } from '../../../components/OptionButton';

import { constants } from '../../../util/contants';
import { usePeerJS } from '../../../hooks/usePeerJS';
import { useInterval } from '../../../hooks/useInterval';

import styles from './styles.module.scss';
import { Audio } from '../../../components/Audio';
import Media from '../../../services/media';
import { FixedMicButton } from '../../../components/FixedMicButton';

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
    [teamID: number]: Team;
}

interface CallsMap {
    [peerID: string]: PeerJS.MediaConnection;
}

interface StreamsMap {
    [peerID: string]: MediaStream;
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

    const [myPeerID, setMyPeerID] = useState('');
    const [mediaStreams, setMediaStreams] = useState<StreamsMap>({});
    const [callsConnected, setCallsConnected] = useState<CallsMap>({})
    const [myMediaStream, setMyMediaStream] = useState<MediaStream>();
    const [isMicrophoneActive, setIsMicrophoneActive] = useState(true);

    const router = useRouter();

    const { peer, makeCall } = usePeerJS({
        onOpen: (myPeerID) => { 
            console.log('Open', myPeerID);
            setMyPeerID(myPeerID);
        },
        onConnection: (data) => { console.log('Connection', data) },
        onCall: async (call) => {
            console.log('Call received', call);
            if(myMediaStream) {
                console.log('Respondendo chamada', myMediaStream)
                call.answer(myMediaStream);
            }
        },
        onStreamReceived: (call, stream) => { 
            console.log('Stream received', stream);
            console.log('Call received', call.peer);
            setMediaStreams(oldMediaStreams => {
                return {
                    ...oldMediaStreams,
                    [call.peer]: stream
                };
            });

            setCallsConnected(oldCalls => {
                return {
                    ...oldCalls,
                    [call.peer]: call
                };
            });
        },
        onCallClosed: (call) => console.log('Call closed', call),
        onCallError: (call, error) => console.log('Error on call', call, error)
    });

    useInterval(
        () => setTimeLeftToAnswer(oldValue => oldValue - 1),
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
        if(userStoraged) {
            setUsername(userStoraged.username);
            setMyUser(userStoraged);
        }
    }, []);

    useEffect(() => {
        (async () => {
            let stream: MediaStream;
            try {
                stream = await Media.getUserAudio();
                setMyMediaStream(stream);
                setIsMicrophoneActive(true);
            } catch(e) {
                console.log('Criando midia falsa pois não foi permitido acesso ao áudio', e);
                stream = Media.createMediaStreamFake();
                console.log('Media fake', stream)
                setMyMediaStream(stream);
                setIsMicrophoneActive(false);
            }
        })(); 
    }, [])

    useEffect(() => {
        socket.off(constants.events.NEW_USER_ON_ROOM);
        socket.on(constants.events.NEW_USER_ON_ROOM, ({ room, user }) => {
            console.log('New user on Room', user);
            console.log('Room updated', room);
            setRoom(room);

            // Verifica se novo usuário não é o meu. Se não for, liga para ele
            const storagedUser = LocalDatabase.getUser();
            if(storagedUser.username !== user.username) {
                if(myMediaStream) {
                    makeCall(user.peerID, myMediaStream);
                }

                toast.info(`${user.username} entrou na sala!`);
            }
        });
    }, [peer?.id]);

    useEffect(() => {
        socket.on(constants.events.USER_DISCONNECTED, ({ room, user }) => {
            console.log('User disconnected', user);
            console.log('Room updated', room);
            setRoom(room);

            // Verificar se sou o novo dono da sala
            const storagedUser = LocalDatabase.getUser();
            if(room.owner.username === storagedUser.username)
                setIsOwner(true);

            // Desconectar conexão com ele
            setCallsConnected(calls => {
                const { [user.peerID]: callToClose, ...updatedCalls } = calls;
                callToClose?.close();
                return updatedCalls;
            });

            setMediaStreams(streams => {
                const { [user.peerID]: removedStream, ...updatedStreams } = streams;
                return updatedStreams;
            });

            toast.info(`${user.username} saiu da sala.`);
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

        socket.on(constants.events.NON_EXISTENT_ROOM, () => {
            toast.error('Essa sala não existe!');
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

        return () => {
            socket.disconnect();
        }
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

        const myUserData: User = {
            username: username,
            peerID: myPeerID
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
        
        if(!answerOptionChoiced)
            return toast.error('Escolha alguma opção')
        

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

    function isValidURL(str: string) {
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    }

    async function toggleMicrophone() {
        let stream: MediaStream;
        try {
            stream = isMicrophoneActive 
                ? Media.createMediaStreamFake()
                : await Media.getUserAudio()
        } catch(e) {
            toast.info('Você precisa liberar o accesso ao microfone.');
            return;
        }
        
        // Fechar todas conecções
        for (const peerID in callsConnected) {
            callsConnected[peerID].close();
            makeCall(peerID, stream);
        }

        setMyMediaStream(stream);
        setIsMicrophoneActive(oldValue => !oldValue);
        setCallsConnected({});
        setMediaStreams({});
    }

    function handleFinishGameButtonClick() {
        const res = confirm("Tem certeza que deseja encerrar o jogo?");

        if(!res) return;

        socket.emit(constants.events.FINISH_GAME, { roomID });

        setGameStarted(false);
        setGameFinished(true);
        setChoicedTeams({});
    }

    if(!isMyUserSet) {
        return (
            <div className={styles.container}>
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
            </div>
        )
    }

    if(!gameStarted) {
        return (
            <div className={styles.container}>
                <div className={styles.userOnRoomList}>
                    <h2>Lista de usuários na sala</h2>
                    <ul>
                        {room && room.users && room.users.map((user: User) => (
                            <li key={user.username}>
                                <span>{user.username}</span>
                                <div className={styles.teamsButton}>
                                    <button
                                        disabled={!isOwner}
                                        onClick={() => handleTeamOptionChanged(1, user)}
                                        className={choicedTeams[user.username]?.teamID === 1 ? styles.choiced : ''}
                                    >Time 01</button>
                                    
                                    <button
                                        disabled={!isOwner}
                                        onClick={() => handleTeamOptionChanged(2, user)}
                                        className={choicedTeams[user.username]?.teamID === 2 ? styles.choiced : ''}
                                    >Time 02</button>
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
                                <Button onClick={shareRoomLink}><FiShare2 />Compartilhar link</Button>
                            </div>
                        </>
                    )}
                </div>
                <FixedMicButton isActive={isMicrophoneActive} onClick={toggleMicrophone} />
                {Object.keys(mediaStreams).map(peerID => (
                    <Audio key={peerID} srcObject={mediaStreams[peerID]} autoPlay />
                ))}
            </div>
        )
    }

    return (
        <>
            <TimeBar
                totalTime={timeToAnswer}
                timeLeft={timeLeftToAnswer}
            />
            <div className={styles.container}>
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
                                { isOwner && (
                                    <Button disabled={!isOwner} onClick={handleClickRestartGameButton}>
                                        Jogar outra partida
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                {!currentQuestion ? (
                                    <p>Esperando a primeira pergunta...</p>
                                ) : (
                                    <div className={styles.question}>
                                        <h3>Pergunta ({currentQuestionPosition} / {questionsQuantity}): {currentQuestion.question}</h3>
                                        <div className={styles.options}>
                                            {currentQuestion.options.map(option => (
                                                <OptionButton
                                                    key={option.id}
                                                    clicked={answerOptionChoiced === option.id}
                                                    onClick={() => setAnswerOptionChoiced(option.id)}
                                                    disabled={currentTeam !== myTeam || waitingNextQuestion}
                                                > {option.value}
                                                </OptionButton>
                                            ))}
                                        </div>
                                        {waitingNextQuestion && currentQuestion.reference && (
                                            <div className={styles.reference}>
                                                {isValidURL(currentQuestion.reference) ? (
                                                    <a 
                                                        href={currentQuestion.reference}
                                                        target="_blank"
                                                        >Referência da resposta <FiLink /></a>
                                                ) : (
                                                    <span>Referência da resposta: <strong>{currentQuestion.reference}</strong></span>
                                                )}
                                            </div>
                                        )}
                                        <div className={styles.submitButton}>
                                            {(currentTeam === myTeam) && !waitingNextQuestion && (
                                                <button
                                                    className={styles.answerButton}
                                                    onClick={handleClickAnswerQuestionButton}
                                                > Responder
                                                </button>
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
                        <div>
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
                            { isOwner && (
                                <button 
                                    className={styles.finishGameButton} 
                                    onClick={handleFinishGameButtonClick}
                                >
                                    <FiX size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <FixedMicButton isActive={isMicrophoneActive} onClick={toggleMicrophone} />
            {Object.keys(mediaStreams).map(peerID => (
                <Audio key={peerID} srcObject={mediaStreams[peerID]} autoPlay />
            ))}
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    return {
        props: {
            timeToAnswer: query.timeToAnswer ?? 30
        }
    }
}
