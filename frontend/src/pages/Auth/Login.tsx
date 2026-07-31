import { useUser } from "@/context/UserContext";
import { google } from "@/firebase";
import { OAuthButton, OAuthScreen } from "@firebase-oss/ui-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const {firebaseUser} = useUser();
    useEffect(() => {
        if (firebaseUser) navigate('/');
    }, [navigate, firebaseUser]);
    return <OAuthScreen>
        <OAuthButton provider={google}>Google</OAuthButton>
    </OAuthScreen>
}
 
export default Login;