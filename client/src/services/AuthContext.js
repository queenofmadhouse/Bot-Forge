import React, {createContext, useContext, useState, useEffect} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({children}) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token && userId) {
            fetchUserProfile(userId)
                .then(user => {
                    setCurrentUser(user);
                })
                .catch(error => {
                    console.error('Error fetching user profile:', error);
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            const response = await axios.get(`/api/users/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Fetch user profile error:', error);
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/users/login', {email, password});

            // Save token and user ID
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userId', response.data.userId);

            // Fetch user profile
            const user = await fetchUserProfile(response.data.userId);
            setCurrentUser(user);

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post('/api/users/register', {username, email, password});
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setCurrentUser(null);
    };

    const createBot = async (name, token) => {
        try {

            const response = await axios.post('/api/bot-builder', {
                name: name,
                token: token,
                ownerId: currentUser._id
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Create bot error:', error);
            throw error;
        }
    }

    const fetchMyBots = async () => {
        try {
            const response = await axios.get(`/api/bot-builder/user/${currentUser._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            return response.data;
        } catch (error) {
        }
    }

    const fetchBotDetails = async (botId) => {

        const response = await axios.get(`/api/bot-builder/${botId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return response.data;
    }

    const addCommand = async (botId, commandName, commandDescription, commandResponse) => {
        const response = await axios.post(`/api/bot-builder/commands/${botId}`, {
            name: commandName,
            description: commandDescription,
            response: commandResponse
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return response.data;
    }

    const value = {
        currentUser,
        login,
        register,
        logout,
        createBot,
        fetchMyBots,
        fetchBotDetails,
        addCommand
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}