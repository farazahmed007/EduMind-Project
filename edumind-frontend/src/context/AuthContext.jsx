import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";


const API_BASE_URL = "http://127.0.0.1:8000";

const AUTH_TOKEN_KEY = "edumind_access_token";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [token, setToken] = useState(
        () => localStorage.getItem(AUTH_TOKEN_KEY)
    );

    const [loading, setLoading] = useState(true);


    // --------------------------------------------------
    // Store authentication token
    // --------------------------------------------------

    const saveToken = (accessToken) => {

        localStorage.setItem(
            AUTH_TOKEN_KEY,
            accessToken
        );

        setToken(accessToken);
    };


    // --------------------------------------------------
    // Clear authentication
    // --------------------------------------------------

    const clearAuthentication = () => {

        localStorage.removeItem(
            AUTH_TOKEN_KEY
        );

        setToken(null);
        setUser(null);
    };


    // --------------------------------------------------
    // Get current authenticated user
    // --------------------------------------------------

    const fetchCurrentUser = async (accessToken) => {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );


        if (!response.ok) {

            throw new Error(
                "Authentication session is no longer valid."
            );
        }


        const data = await response.json();

        return data.user;
    };


    // --------------------------------------------------
    // Initialize authentication
    // --------------------------------------------------

    useEffect(() => {

        let isMounted = true;


        const initializeAuthentication = async () => {

            const storedToken =
                localStorage.getItem(
                    AUTH_TOKEN_KEY
                );


            if (!storedToken) {

                if (isMounted) {

                    setUser(null);
                    setLoading(false);
                }

                return;
            }


            try {

                const currentUser =
                    await fetchCurrentUser(
                        storedToken
                    );


                if (isMounted) {

                    setToken(storedToken);
                    setUser(currentUser);
                }

            } catch (error) {

                console.error(
                    "Authentication initialization failed:",
                    error
                );


                localStorage.removeItem(
                    AUTH_TOKEN_KEY
                );


                if (isMounted) {

                    setToken(null);
                    setUser(null);
                }

            } finally {

                if (isMounted) {

                    setLoading(false);
                }
            }
        };


        initializeAuthentication();


        return () => {

            isMounted = false;
        };

    }, []);


    // --------------------------------------------------
    // Register
    // --------------------------------------------------

    const register = async ({
        name,
        email,
        password,
    }) => {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to create account."
            );
        }


        return data;
    };


    // --------------------------------------------------
    // Login
    // --------------------------------------------------

    const login = async ({
        email,
        password,
    }) => {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Invalid email or password."
            );
        }


        saveToken(
            data.access_token
        );


        setUser(
            data.user
        );


        return data;
    };


    // --------------------------------------------------
    // Logout
    // --------------------------------------------------

    const logout = () => {

        clearAuthentication();
    };


    // --------------------------------------------------
    // Authenticated fetch helper
    // --------------------------------------------------

    const authFetch = async (
        url,
        options = {}
    ) => {

        const currentToken =
            localStorage.getItem(
                AUTH_TOKEN_KEY
            );


        const headers = {
            ...(options.headers || {}),
        };


        if (currentToken) {

            headers.Authorization =
                `Bearer ${currentToken}`;
        }


        return fetch(
            url,
            {
                ...options,
                headers,
            }
        );
    };


    // --------------------------------------------------
    // Context value
    // --------------------------------------------------

    const contextValue = useMemo(
        () => ({
            user,
            token,
            loading,
            isAuthenticated: Boolean(
                user && token
            ),
            register,
            login,
            logout,
            authFetch,
            refreshUser: async () => {

                if (!token) {

                    return null;
                }


                try {

                    const currentUser =
                        await fetchCurrentUser(
                            token
                        );


                    setUser(
                        currentUser
                    );


                    return currentUser;

                } catch (error) {

                    clearAuthentication();

                    throw error;
                }
            },
        }),

        [
            user,
            token,
            loading,
        ]
    );


    return (
        <AuthContext.Provider
            value={contextValue}
        >
            {children}
        </AuthContext.Provider>
    );
}


// --------------------------------------------------
// useAuth hook
// --------------------------------------------------

export function useAuth() {

    const context =
        useContext(
            AuthContext
        );


    if (!context) {

        throw new Error(
            "useAuth must be used inside an AuthProvider."
        );
    }


    return context;
}