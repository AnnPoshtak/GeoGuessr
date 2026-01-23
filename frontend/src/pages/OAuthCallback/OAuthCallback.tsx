import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

function OAuthCallback() {
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const status = searchParams.get('status');
        if (!status) return;
        if (status === 'error') {
            toast.error('An error occured. Please, try again!', { id: 'oauth-message' });
        }
        toast.success('Login successful!', { id: 'oauth-message' });
    }, []);
    return <Navigate to={'/'} />;
}

export default OAuthCallback;