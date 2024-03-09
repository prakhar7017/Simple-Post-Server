import bcrypt from 'bcrypt';
import omit from 'lodash.omit';
import { Document, isValidObjectId, model, Schema } from "mongoose";
import { IPost } from './PostSchema';


export enum EGender {
    male = 'male',
    female = 'female',
    unspecified = 'unspecified'
}

export interface IUser extends Document {
    email: string;
    password: string;
    username: string;
    firstname?: string;
    lastname?: string;
    dateJoined?: string | Date;
    isFollowing?: boolean;
    passwordMatch?(pw: string, callback: (error: any, match: any) => void): void;
}

const UserSchema = new Schema({
    email: {
        type: String,
        minlength: 12,
        unique: true,
        required: [true, 'Email is required.'],
        lowercase: true,
        maxlength: 64,
        validate: {
            validator: (email) => {
                const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
                return regex.test(email);
            },
            message: '{VALUE} is invalid.'
        }
    },
    password: {
        type: String,
        minlength: 8,
        required: true,
        maxlength: 100
    },
    username: {
        type: String,
        unique: true,
        required: [true, 'Username is required.'],
        lowercase: true,
        minlength: 4,
        maxlength: 30,
        validate: {
            validator: (username) => {
                const regex = /^[a-z]+_?[a-z0-9]{1,}?$/ig;
                return regex.test(username);
            },
            message: 'Username Must preceed with letters followed by _ or numbers eg: john23 | john_23'
        }
    },
    firstname: {
        type: String,
        maxlength: 40
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    dateJoined: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret, opt) {
            delete ret.password;
            return ret;
        }
    },
    toObject: {
        getters: true,
        virtuals: true,
        transform: function (doc, ret, opt) {
            delete ret.password;
            return ret;
        }
    }
});

UserSchema.virtual('fullname').get(function () {
    const { firstname, lastname } = this;
    return (firstname && lastname) ? `${this.firstname} ${this.lastname}` : null;
});

// UserSchema.set('toObject', { getters: true });

UserSchema.methods.passwordMatch = function (this: IUser, password, cb) {
    const user = this;

    bcrypt.compare(password, user.password, function (err: any, isMatch: any) {
        if (err) return cb(err);

        cb(null, isMatch);
    });
}


UserSchema.pre('save', function (this: IUser, next) {
    if (this.firstname === null) this.firstname = '';
    if (this.lastname === null) this.lastname = '';
    if (this.isNew || this.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(this.password, salt, (err, hash) => {
                this.password = hash;
                next();
            });
        })
    } else {
        next();
    }
});

const User = model<IUser>('User', UserSchema);
export default User;
