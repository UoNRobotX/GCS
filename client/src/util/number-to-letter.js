export default function(number) {
    if (number > 48) {
        return '0';
    }

    let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    return alphabet[number - 1];
}
