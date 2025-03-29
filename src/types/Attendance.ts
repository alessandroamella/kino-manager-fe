import { BaseDocument } from './BaseDocument';
import { Member } from './Member';

export interface Attendance extends BaseDocument {
  checkInUTC: Date;
  member: Member;
}
