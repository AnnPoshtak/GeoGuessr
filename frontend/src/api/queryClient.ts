import { QueryClient } from "@tanstack/react-query";


const queryClient = new QueryClient();
declare global {
    interface Window {
        __TANSTACK_QUERY_CLIENT__:
        import("@tanstack/query-core").QueryClient;
    }
}

window.__TANSTACK_QUERY_CLIENT__ = queryClient;

export default queryClient;