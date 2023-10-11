import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UserId } from 'src/shared/interfaces/chat.interface';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';

export enum Action {
  Kick = 'kick',
  Join = 'join',
  Message = 'message',
}

type Subjects = InferSubjects<typeof Room | typeof User> | 'all';
export type AppAbility = MongoAbility<[Action, Subjects]>;
type FlatRoom = Room & {
  'host.userId': string | undefined;
};

@Injectable()
export class CaslAbilityFactory {
  createForUser(userId: UserId) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Host can kick users from room
    can<FlatRoom>(Action.Kick, Room, {
      'host.userId': userId,
    });

    // Any user can join any room
    can(Action.Join, Room);

    // User can send messages in room given they are in the room
    can(Action.Message, Room, {
      users: { $elemMatch: { userId } },
    });

    return build({
      detectSubjectType: (object) =>
        object.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
