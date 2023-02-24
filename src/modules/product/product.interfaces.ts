import mongoose, { Model, Document, ObjectId } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
//import { AccessAndRefreshTokens } from '../token/token.interfaces';


export interface IProduct {
    _id: mongoose.Types.ObjectId,
    name: string;
    description: string;
    price: number;
    stock: number;
    type: string;
    obs: string;
    postOn: Array<any>;
    hide: boolean;
    dueDate: Date;
    user:ObjectId
  }


export interface IProductDoc extends IProduct, Document {
  _id: mongoose.Types.ObjectId,
  }


export interface IProductModel extends Model<IProductDoc>{
    _id: mongoose.Types.ObjectId,
    paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
  }

export type UpdateProductBody = Partial<IProduct>;

export type NewCreatedProduct = Partial<IProduct>;