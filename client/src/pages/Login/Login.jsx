import Background from "../../components/Layout/Background";
import GlassPanel from "../../components/Glass/GlassPanel";

import Heading from "../../components/UI/Heading/Heading";
import TextInput from "../../components/UI/TextInput/TextInput";

import AvatarCircle from "../../components/UI/AvatarCircle/AvatarCircle";
import PrimaryButton from "../../components/UI/PrimaryButton/PrimaryButton";

import background from "../../assets/background.png";

import { useState, useEffect, useRef } from "react";
import Workspace from "../Workspace/Workspace";

function Login({ setLoggedIn }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    const [usernameError, setUsernameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    useEffect(() => {

        usernameRef.current?.focus();

    }, []);

    return (

        <main className="app">

            <Background />

            <div className="loginWrapper">

                <GlassPanel className="loginCard">

                    <div className="loginHeader">

                        <Heading
                            title="Login"
                            subtitle="Welcome back. Sign in to continue."
                        />

                        <AvatarCircle image={background} />

                    </div>

                    <TextInput
                        label="Username"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        inputRef={usernameRef}
                        error={usernameError}
                    />

                    <TextInput
                        label="Password"
                        placeholder="Enter password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        inputRef={passwordRef}
                        error={passwordError}
                    />

                    <PrimaryButton
                        onClick={() => {

                            const badUsername = username !== "admin";
                            const badPassword = password !== "test123";

                            setUsernameError(badUsername);
                            setPasswordError(badPassword);

                            if (badUsername) {

                                usernameRef.current?.focus();

                            } else if (badPassword) {

                                passwordRef.current?.focus();

                            } else {

                                setLoggedIn(true);
                                return;

                            }

                            setTimeout(() => {

                                setUsernameError(false);
                                setPasswordError(false);

                            }, 3000);

                        }}
                    >
                        Sign In
                    </PrimaryButton>

                </GlassPanel>

            </div>

        </main>

    );

}

export default Login;