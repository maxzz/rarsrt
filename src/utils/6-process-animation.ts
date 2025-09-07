export class LineAnimation {
    animIndex = 0;
    animations = [".  ", ".. ", "...", " ..", "  .", "   ",];
    lastMsgLenght = this.animations.length;

    updateAnimation(msg?: string) { // write state line
        this.clear();
        const s = ` ${this.animations[++this.animIndex % this.animations.length]} ${msg || ''} \r`;
        this.lastMsgLenght = s.length;
        process.stdout.write(s);
    }

    clear() { // clean state line
        process.stdout.write(`${' '.repeat(this.lastMsgLenght)}\r`);
        this.lastMsgLenght = 0;
    }
}
