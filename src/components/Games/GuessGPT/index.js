import React, { useEffect, useState } from 'react'
import Heading from '../../UI/Heading'
import GuessResults from './GuessResults';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content'
import Loading from '@/components/Layout/Loading';
import shuffleArray from '@/lib/shuffleArray';
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from 'howler';
import LinearProgress from '@mui/material/LinearProgress';

import Img from '@/components/UI/Img';

const CORRECT_THRESHOLD = 0.91; // Cosine similarity threshold to be considered correct
const SFX_VOL = 0.5;

const MySwal = withReactContent(Swal)

export default function GuessGPT() {
    const [gameIsActive, setGameIsActive] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [gameResults, setGameResults] = useState([]);
    const [gameData, setGameData] = useState();
    const [gameIndex, setGameIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState();
    const [submitted, setSubmitted] = useState('');

    // Initialize sound effects
    const sfxStart = new Howl({
        src: ['/sfx/start.webm', '/sfx/start.mp3'],
        volume: 1
    });

    const sfxWin = new Howl({
        src: ['/sfx/win2.webm', '/sfx/win2.mp3'],
        volume: SFX_VOL
    });

    const sfxLose = new Howl({
        src: ['/sfx/wrong.webm', '/sfx/wrong.mp3'],
        volume: SFX_VOL
    });

    const sfxWinGame = new Howl({
        src: ['/sfx/wingame.webm', '/sfx/wingame.mp3'],
        volume: 1
    });

    const startGame = async () => {
        setIsLoading(true);
        try {
            const result = await axios.get("/api/guessgpt/get-game");
            setGameData(shuffleArray(result.data.documents));
            setGameIsActive(true);
            sfxStart.play();
        } catch (err) {
            Swal.fire({
                title: "Error",
                html: "Could not fetch gama data!"
            })
        } finally {
            setIsLoading(false);
        }
    }

    const resetGame = () => {
        setGameIsActive(false);
        setShowResults(false);
        setGameResults([]);
        setGameData(null);
        setGameIndex(0);
        setTotalScore(0);
        setIsLoading(false);
        setToken(null);
    }

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('answer', gameData[gameIndex].answer);
        formData.append('submitted', submitted);
        formData.append('token', token);
        setIsLoading(true);
        try {
            const response = await fetch("/api/guessgpt/submit", {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const mess = await response.text();
                throw new Error(mess);
            }
            const json = await response.json();

            return handleResult(parseFloat(json.score.toFixed(2)));
        } catch (err) {
            Swal.fire({
                title: "Error",
                html: err.message
            })
        } finally {
            setIsLoading(false);
        }
    }

    const handleResult = (score) => {
        let message;
        if (score >= CORRECT_THRESHOLD) {
            message = "You Guessed Right! 🤗";
            sfxWin.play();
        } else {
            message = "Sorry, Not Quite Right 😟";
            sfxLose.play();
        }
        Swal.fire({
            title: message
        });
        setTotalScore(oldVal => oldVal + score);
        setGameResults(oldVal => ([
            ...oldVal,
            {
                phrase: gameData[gameIndex],
                answer: submitted,
                score: score
            }
        ]))
        if (gameIndex + 1 >= gameData.length) {
            // Game is over
            endGame();
        } else {
            // Game continues
            setGameIndex(oldVal => oldVal + 1);
        }
        setSubmitted('');
    }

    const endGame = () => {
        sfxWinGame.play();
        setGameIsActive(false);
        setShowResults(true);
    }

    useEffect(() => {
        if (submitted) {
            handleSubmit();
        }
    }, [submitted]); //eslint-disable-line

    const answer = () => {
        MySwal.fire({
            title: 'Submit your answer',
            input: 'text',
            html: <div className="flex [&>*]:mx-auto h-[65px]">
                
            </div>,
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Submit',

            showLoaderOnConfirm: true,
            preConfirm: async (answer) => {
                setSubmitted(answer);
            },
            allowOutsideClick: () => !Swal.isLoading()
        });
    }

    return (
        <>
            <Loading isLoading={isLoading} />
            <div className="bg-bg2 py-20 px-4 min-h-screen">
                <Heading type='h1' appendClass="text-center mb-10">GuessGPT</Heading>
                <div className="flex flex-col gap-6 [&>*]:mx-auto">
                    {
                        showResults
                            ?
                            <GuessResults
                                results={gameResults}
                                score={totalScore}
                                resetGame={resetGame}
                            />
                            :
                            <>
                                {
                                    gameIsActive
                                        ?
                                        <AnimatePresence>
                                            <motion.div
                                                className="flex flex-col gap-6"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <div className="w-full md:w-[500px]">
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={(gameIndex + 1) / gameData.length * 100}
                                                        sx={{ height: '10px' }}
                                                    />
                                                    <Img
                                                        className="w-fit h-auto"
                                                        src={`https://cdn.designly.biz/games/guessgpt/${gameData[gameIndex].image}`}
                                                        alt="Game Image"
                                                    />
                                                </div>
                                                <div className="flex justify-around">
                                                    <button
                                                        className="btn-bordered bg-cyan-700 hover:bg-cyan-500"
                                                        onClick={answer}
                                                    >Answer</button>
                                                    <div className="text-center">
                                                        <div className="text-sm text-green-500">SCORE</div>
                                                        <div>{totalScore}</div>
                                                    </div>
                                                    <button
                                                        className="btn-bordered bg-fuchsia-700 hover:bg-fuchsia-500"
                                                        onClick={resetGame}
                                                    >Reset Game</button>
                                                </div>
                                                <button
                                                    className="btn-bordered bg-indigo-700 hover:bg-indigo-500 mx-auto"
                                                    onClick={endGame}
                                                >End Game</button>
                                            </motion.div>
                                        </AnimatePresence>
                                        :
                                        <div className="max-w-[600px] flex flex-col gap-6">
                                            <p>This game uses natural language processing techniques to determine the semantic similarity between the player&apos;s answer and the correct phrase.</p>
                                            <p>You will be shown a series of AI-generated images. Each image represents a word or phrase. Your goal is to try to guess the phrase.</p>
                                            <button className="btn-bordered bg-bg0 hover:bg-bg2 mx-auto" onClick={startGame}>Start</button>
                                        </div>
                                }
                            </>
                    }
                </div>
            </div >
        </>
    )
}
