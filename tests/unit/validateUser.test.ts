import { createUserSchema } from '../../src/models/user';
import { validate } from '../../src/middleware/validate.middleware'


const validUser = {
    "name": "Una",
    "phonenumber": "0871234567",
    "email": "john.doe@mymail.ie",
    "dob": "2001/01/12"
}

describe('Date of Birth Validation', () => {
    it('should pass for the following valid data', () => {

        expect(() => createUserSchema.parse(
            validUser)).not.toThrow();
    });


    it('should fail for the unparsable date 45/12/2023', () => {


        expect(() => createUserSchema.parse(
            { ...validUser, "dob": '45/12/2023' })).toThrow();
    });
});



describe('Date of Birth Validation', () => {
    it('should pass for the following valid dates', () => {
        const validDates = [
            '1970/01/01',
            '1987/12/03',
            '1987-11-30',
        ];

        validDates.forEach((date) => {
            expect(() => createUserSchema.parse(
                { ...validUser, "dob": date, })).not.toThrow();
        });
    });

    it('should fail for invalid Dates', () => {
        const invalidDates = [
            '2026ty/01/02',         // wrong year
            '2000/13/01',          // wrong month
            '09/10/2026',          // in the future
            '1st march 20121',      // wrong date
            'blah balh',     // wrong wrong wrong
        ];

        invalidDates.forEach((date) => {
            expect(() => createUserSchema.parse(
                { ...validUser, "dob": date })).toThrow();
        });
    });
});