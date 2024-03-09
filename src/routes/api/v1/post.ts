import { Router, Request, Response, NextFunction } from 'express';
import { ErrorHandler, isAuthenticated, validateObjectID } from '@/middlewares';
import { jwtTokenValidator } from "../../../middlewares/authmilddleware"
import { Post, User } from '@/schemas';
import { EPrivacy } from '@/schemas/PostSchema';
import { schemas, validateBody } from '@/validations/validations';
import { IUser } from '@/schemas/UserSchema';
import { IPost } from '@/schemas/PostSchema';
import { isValidObjectId } from 'mongoose';
import PostSchema from '@/schemas/PostSchema';
import { makeResponseJson } from '@/helpers/utils';

const router = Router();

// Route to create a new post
router.post('/posts', jwtTokenValidator, validateBody(schemas.createPostSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract necessary information from request body
        const { _author_id, privacy, description } = req.body;

        // Check if the author exists
        const author: IUser | null = await User.findById(_author_id);
        if (!author) {
            return next(new ErrorHandler(404, 'Author not found'));
        }

        // Create a new post
        const newPost: IPost = new Post({
            _author_id,
            privacy,
            description
        });

        // Save the post to the database
        await newPost.save();

        // Respond with the newly created post
        res.status(200).json(makeResponseJson({ post: newPost }, true));
    } catch (error) {
        // Handle any errors
        next(new ErrorHandler(500, 'Internal Server Error'));
    }
});

router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Query the database for all posts
        const posts = await Post.find();

        // Return the posts as a response
        return res.status(200).json(makeResponseJson({ posts:posts }, true));
    } catch (error) {
        // Handle any errors
        console.error('Error fetching posts:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = req.params.id; // Extract the post ID from the request parameters
        const updateData = req.body; // Extract the updated data from the request body

        // Find the post by ID and update it
        const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true });

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Return the updated post as a response
        return res.status(200).json(makeResponseJson({ post: updatedPost }, true));
    } catch (error) {
        console.error('Error updating post:', error);
        next(new ErrorHandler(500, 'Internal Server Error'))
    }
});

router.delete('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = req.params.id; // Extract the post ID from the request parameters

        // Find the post by ID and delete it
        const deletedPost = await Post.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Return the deleted post as a response
        return res.status(200).json({ message: 'Post deleted successfully', deletedPost });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


export default router;
