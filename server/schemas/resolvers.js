const { User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');
const { GraphQLError } = require('graphql');
const { ApolloServerErrorCode } = require('@apollo/server/errors');

const resolvers = {
    Query: {
        users: async () => {
            try {
                return await User.find();
            } catch (error) {
                console.error(error);
                throw new Error('Failed to fetch users');
            }
        },
        user: async (parent, { username }) => {
            try {
                return await User.findOne({ username })
            } catch (error) {
                console.error(error);
                throw new Error('Failed to fetch user');
            }
        },
        me: async (parent, args, context) => {
            try {
                if (context.user) {
                    return await User.findOne({ _id: context.user._id })
                }
                throw AuthenticationError;
            } catch (error) {
                console.error(error);
                throw new Error('Failed to fetch user');
            }
        },
    },

    Mutation: {
        addUser: async (parent, { username, email, password }) => {
            if (password.length < 6) {
                throw new GraphQLError('Password must be 6+ characters.', {
                    extensions: {
                        code: ApolloServerErrorCode.BAD_USER_INPUT,
                    },
                });
            }

            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },

        login: async (parent, { email, password }) => {
            try {
                const user = await User.findOne({ email });

                if(!user) {
                    throw AuthenticationError;
                }

                const correctPw = await user.isCorrectPassword(password);

                if(!correctPw) {
                    throw AuthenticationError;
                }

                const token = signToken(user);

                return { token, user };
            } catch (error) {
                console.error(error);
                throw new Error('Login failed');
            }
        },
    },
};

module.exports = resolvers;