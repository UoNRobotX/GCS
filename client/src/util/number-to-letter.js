export default function(number) {
    if (number > 52) {
        return '0';
    }

    let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    return alphabet[number - 1];
}
