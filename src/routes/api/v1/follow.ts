import { USERS_LIMIT } from '@/constants/constants';
import { makeResponseJson } from '@/helpers/utils';
import { ErrorHandler, isAuthenticated, validateObjectID } from '@/middlewares';
import { Follow,Post, User } from '@/schemas';
import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';

const router = Router({ mergeParams: true });

router.post(
    '/v1/follow/:follow_id',
    isAuthenticated, // Assuming isAuthenticated middleware is defined
    validateObjectID('follow_id'), // Assuming validateObjectID middleware is defined
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { follow_id } = req.params;

            // Check if the user being followed exists
            const user = await User.findById(follow_id);
            if (!user) {
                return next(new ErrorHandler(400, "The person you're trying to follow doesn't exist."));
            }

            // Check if the user is trying to follow themselves
            if (follow_id === req.user._id.toString()) {
                return next(new ErrorHandler(400, "You can't follow yourself."));
            }

            // Check if already following
            const isFollowing = await Follow.findOne({
                _user_id: req.user._id,
                following: follow_id
            });

            if (isFollowing) {
                return next(new ErrorHandler(400, 'Already following.'));
            }

            // Update user's following list
            await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: follow_id } });

            // Update followed user's followers list
            await User.findByIdAndUpdate(follow_id, { $addToSet: { followers: req.user._id } });

            // Subscribe to followed user's feed
            const subscribeToUserFeed = await Post.find({ _author_id: follow_id })
                                                  .sort({ createdAt: -1 })
                                                  .limit(10);

            return res.status(200).json(makeResponseJson({ state: true }));
        } catch (error) {
            console.error('Error following user:', error);
            next(error);
        }
    }
);
router.post(
    '/v1/unfollow/:follow_id',
    isAuthenticated, // Assuming isAuthenticated middleware is defined
    validateObjectID('follow_id'), // Assuming validateObjectID middleware is defined
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { follow_id } = req.params;

            // Check if the user being unfollowed exists
            const user = await User.findById(follow_id);
            if (!user) {
                return next(new ErrorHandler(400, "The person you're trying to unfollow doesn't exist."));
            }

            // Check if the user is trying to unfollow themselves
            if (follow_id === req.user._id.toString()) {
                return next(new ErrorHandler(400, "You can't unfollow yourself."));
            }

            // Update user's following list
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: follow_id } });

            // Update followed user's followers list
            await User.findByIdAndUpdate(follow_id, { $pull: { followers: req.user._id } });

            return res.status(200).json(makeResponseJson({ state: false }));
        } catch (error) {
            console.error('Error unfollowing user:', error);
            next(error);
        }
    }
);
router.get(
    '/v1/:username/following',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;
            const offset = parseInt(req.query.offset) || 0;
            const limit = USERS_LIMIT;
            const skip = offset * limit;

            // TODO ---------- TEST LIMIT AND SKIP
            const follow = await Follow.findOne({ _user_id: req.user._id });
            const myFollowing = follow ? follow.following : [];
            const user = await User.findOne({ username });
            if (!user) return next(new ErrorHandler(400));

            const doc = await Follow.aggregate([
                {
                    $match: {
                        _user_id: new Types.ObjectId(user._id)
                    }
                },
                { $unwind: '$following' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'following',
                        foreignField: '_id',
                        as: 'userFollowing',
                    }
                },
                { $unwind: '$userFollowing' },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        user: {
                            id: '$userFollowing._id',
                            username: '$userFollowing.username',
                            profilePicture: '$userFollowing.profilePicture',
                            email: '$userFollowing.email',
                            fullname: '$userFollowing.fullname'
                        }
                    }
                },
                {
                    $addFields: {
                        isFollowing: {
                            $in: ['$user.id', myFollowing]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        following: { $push: { user: '$user', isFollowing: '$isFollowing' } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        _user_id: 1,
                        following: 1,
                    }
                }
            ]);

            const { following } = doc[0] || {};
            const finalResult = following ? following : [];

            if (finalResult.length === 0) {
                return next(new ErrorHandler(404, `${username} isn't following anyone.`));
            }

            res.status(200).send(makeResponseJson(finalResult));
        } catch (e) {
            next(e);
        }
    });

    router.get(
        '/v1/:username/followers',
        isAuthenticated, // Assuming isAuthenticated middleware is defined
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { username } = req.params;
                const offset = parseInt(req.query.offset as string) || 0; // Ensure offset is a number
                const limit = USERS_LIMIT;
                const skip = offset * limit;
    
                // Find the user by username
                const user = await User.findOne({ username });
                if (!user) {
                    return next(new ErrorHandler(400, `No user found with username ${username}.`));
                }
    
                // Find the user's followers
                const follow = await Follow.findOne({ _user_id: user._id });
                if (!follow || !follow.followers.length) {
                    return next(new ErrorHandler(404, `${username} has no followers.`));
                }
    
                // Limit the number of followers based on offset and limit
                const followers = follow.followers.slice(skip, skip + limit);
    
                // Prepare response data
                const followersData = await Promise.all(
                    followers.map(async (followerId: string) => {
                        const follower = await User.findById(followerId);
                        return {
                            id: follower?._id,
                            username: follower?.username,
                            email: follower?.email,
                        };
                    })
                );
    
                res.status(200).json(makeResponseJson(followersData));
            } catch (error) {
                console.error('Error getting followers:', error);
                next(error);
            }
        }
    );
    

export default router;