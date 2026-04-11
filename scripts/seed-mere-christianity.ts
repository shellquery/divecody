#!/usr/bin/env tsx
/**
 * Seed Mere Christianity by C.S. Lewis into the database.
 * Run: npx tsx --env-file=.env.local scripts/seed-mere-christianity.ts
 * Re-running is safe — uses onConflictDoNothing().
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { existsSync } from 'node:fs';
import { works, sections, cantos } from '../db/schema';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const dbUrl = process.env.DATABASE_URL ?? process.env.divecody_DATABASE_URL;
if (!dbUrl) {
  console.error('❌  DATABASE_URL is required.');
  process.exit(1);
}
const db = drizzle(neon(dbUrl));

function roman(n: number): string {
  const map: Record<number,string> = {
    1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',
    10:'X',11:'XI',12:'XII',
  };
  return map[n] ?? String(n);
}

async function insertCanto(
  sectionId: string,
  number: number,
  titleEn: string,
  lines: string[],
) {
  await db.insert(cantos).values({
    section_id: sectionId,
    number,
    roman: roman(number),
    title_en: titleEn,
    lines_en: lines,
    lines_zh: null,
  }).onConflictDoNothing();
}

async function main() {
  console.log('🌱  Seeding Mere Christianity…\n');

  // ── Work ─────────────────────────────────────────────────────────────────
  await db.insert(works).values({
    id: 'mere-christianity',
    title: 'Mere Christianity',
    title_zh: '返璞归真',
    author: 'C.S. Lewis',
    author_zh: '克莱夫·斯泰普尔斯·刘易斯',
  }).onConflictDoNothing();

  // ── Sections ──────────────────────────────────────────────────────────────
  await db.insert(sections).values([
    {
      id: 'mc-book-1',
      work_id: 'mere-christianity',
      title: 'Right and Wrong as a Clue to the Meaning of the Universe',
      title_zh: '以善恶为宇宙含义的线索',
      number: 1,
      canto_count: 5,
      translator_en: 'C.S. Lewis (1952)',
      zh_placeholder: true,
      emoji: '⚖️',
    },
    {
      id: 'mc-book-2',
      work_id: 'mere-christianity',
      title: 'What Christians Believe',
      title_zh: '基督徒信仰什么',
      number: 2,
      canto_count: 5,
      translator_en: 'C.S. Lewis (1952)',
      zh_placeholder: true,
      emoji: '✝️',
    },
    {
      id: 'mc-book-3',
      work_id: 'mere-christianity',
      title: 'Christian Behaviour',
      title_zh: '基督徒的行为',
      number: 3,
      canto_count: 12,
      translator_en: 'C.S. Lewis (1952)',
      zh_placeholder: true,
      emoji: '🤝',
    },
    {
      id: 'mc-book-4',
      work_id: 'mere-christianity',
      title: 'Beyond Personality: Or First Steps in the Doctrine of the Trinity',
      title_zh: '超越人格：论三位一体',
      number: 4,
      canto_count: 11,
      translator_en: 'C.S. Lewis (1952)',
      zh_placeholder: true,
      emoji: '🌟',
    },
  ]).onConflictDoNothing();

  console.log('✅  Work + 4 sections\n');

  // ══════════════════════════════════════════════════════════════════════════
  // BOOK 1 — Right and Wrong as a Clue to the Meaning of the Universe
  // ══════════════════════════════════════════════════════════════════════════
  console.log('📖  Book I — Right and Wrong…');

  await insertCanto('mc-book-1', 1, 'The Law of Human Nature', [
    'Every person who has ever been in a quarrel has appealed to some standard outside themselves. "That\'s not fair." "You promised." "How would you like it if someone did that to you?" These words assume a shared understanding of right and wrong — a standard both parties recognize even while one of them violates it.',
    'Lewis calls this shared standard the Law of Human Nature, or the Moral Law. It is not a description of how people do behave — anyone can see that people often behave very badly indeed. It is a law about how people ought to behave, and the curious thing is that they know it. Even those who break the rule know they are breaking it.',
    'This Moral Law is unlike the laws of physics or chemistry. A stone cannot disobey the law of gravity; a human being can disobey the Moral Law. And yet the law is real. The difference between a falling stone and a lying person is not that one is governed by law and the other is not — it is that the person knows the law and chooses to ignore it.',
    'Lewis invites the reader to consider that this universal awareness of moral obligation is itself a clue about the nature of the universe. Something is pressing itself upon human consciousness from within — not an instinct, not a social convention, but something that stands above both and judges them.',
    'This chapter serves as the foundation of everything that follows. Lewis will argue that the existence of the Moral Law points beyond itself, toward a source that is not merely human.',
  ]);
  console.log('   ✅  I-1 The Law of Human Nature');

  await insertCanto('mc-book-1', 2, 'Some Objections', [
    'Two obvious objections arise against calling the Moral Law something real and universal. Lewis takes each seriously and answers it carefully.',
    'The first objection: perhaps what we call the Moral Law is nothing but herd instinct — the same kind of impulse that makes animals protect their young or flock together for safety. Lewis grants that humans do have various instincts, including a social impulse. But the Moral Law is not one of those impulses. It is what tells you which impulse to follow when two of them conflict.',
    'When you hear a cry for help, two impulses may arise simultaneously: the impulse to help, and the impulse to stay safe. The Moral Law is the voice that says "you ought to help." That voice cannot itself be an instinct, because it sits above the instincts and referees between them. A piano has many notes, but the music score that tells you which notes to play is not itself one of the notes.',
    'The second objection: perhaps the Moral Law is merely social conditioning — what we have been taught to think is right by our parents, school, and culture. Lewis concedes that social training shapes our behavior. But this does not explain why some social codes are better than others, or why moral progress is possible at all. When Wilberforce argued that slavery was wrong, he was not just substituting one convention for another — he was appealing to a standard above all conventions.',
    'Furthermore, the content of moral codes across history shows remarkable agreement on the fundamentals. No culture has ever taught that cowardice, treachery, or ingratitude were virtues. The variations in moral codes are far smaller than popular opinion assumes.',
  ]);
  console.log('   ✅  I-2 Some Objections');

  await insertCanto('mc-book-1', 3, 'The Reality of the Law', [
    'Lewis now drives home the main point: the Moral Law is genuinely real. It is not invented by humans, not derived from nature, and not a mere social agreement. It is discovered — as real as mathematics, though experienced from the inside rather than the outside.',
    'Consider the concept of moral progress. If morality were merely a human invention, it would make no sense to say that one civilization\'s morality is better than another\'s. You could only say it is different. But we do say some things are genuine moral improvements — the abolition of torture, the rejection of slavery. These judgments require a standard outside all cultures against which they can be measured.',
    'Lewis uses a helpful analogy. When you say a crooked line is crooked, you are not comparing it to another crooked line — you are comparing it to a straight line that exists as an ideal. Moral criticism of any human action likewise presupposes a standard that transcends the action being judged.',
    'The Law also cannot be derived from facts about nature. Nature is simply what happens — animals eat each other, the strong overwhelm the weak. If we say nature is cruel, we are already applying a moral standard that does not come from nature itself. The very act of criticizing nature implies a vantage point outside it.',
    'This chapter establishes that the Moral Law is real. The question Lewis will now pursue is: what does that reality tell us about the universe? Something is pressing this Law upon human minds — and that something must be explored.',
  ]);
  console.log('   ✅  I-3 The Reality of the Law');

  await insertCanto('mc-book-1', 4, 'What Lies Behind the Law', [
    'Two fundamental views of the universe compete for our allegiance. The first is the materialist view: the universe is matter and energy, it arose by chance, and will end in cold darkness. Everything that appears meaningful — love, beauty, justice — is merely the by-product of physical processes in our brains. The second is the religious view: behind the universe is a consciousness, a Mind, something that is more like a person than like a stone, and which is the source of the Moral Law.',
    'Science, as such, cannot settle this question. Science studies the behavior of things — their patterns, regularities, and interactions. But the question of what lies behind those patterns is not itself a scientific question. To ask what the universe is "for," or whether it has a purpose, is to ask a question that the instruments of science were not built to answer.',
    'Lewis introduces a more direct route to understanding the universe\'s inner nature: the Moral Law experienced from within. When you look at the material world, all you see is events following other events. But the Moral Law is not an event — it is a directive, a sense of "ought," pressing upon consciousness from somewhere. This inner pressure suggests that the power behind the universe is more like a mind than like a force.',
    'The God indicated by this argument is not the same as the universe itself (pantheism), nor a distant clockmaker who set things running and stepped away (deism). He is something that presses moral demands upon people — something with a purpose and a will that cares about behavior.',
    'Lewis is careful: this argument gets us to the threshold of religion but not inside Christianity. It shows there is probably something mind-like behind the universe and that it cares about right conduct. The next book will explore what Christianity specifically claims about this Power.',
  ]);
  console.log('   ✅  I-4 What Lies Behind the Law');

  await insertCanto('mc-book-1', 5, 'We Have Cause to Be Uneasy', [
    'Lewis closes the first book with an uncomfortable observation. The argument so far has established two things: there is a Moral Law, and humans consistently fail to keep it. This is not a pleasant conclusion to sit with.',
    'Christianity does not offer a soft reassurance. It begins, Lewis says, with a diagnosis that should make people very uncomfortable. The Power behind the universe cares intensely about right behavior, and every human being knows at some level that they have not lived up to the standard they themselves recognize. This is not primarily about social failures or crimes — it is about the quiet record of selfishness, cowardice, and dishonesty that each person carries.',
    'This discomfort is not Lewis\'s invention — it is the starting point of the Christian message. There is something deeply wrong, not just in the world, but in each person. Any religion or philosophy that does not begin here is offering comfort without diagnosis — medicine to someone who has not yet admitted they are ill.',
    'Lewis ends the book deliberately without resolution. The reader is left in need of something. What that something is — what Christianity claims to offer — is the subject of the books that follow. The first book\'s job was not to comfort but to prepare: to show why the question matters and why a serious answer is worth hearing.',
  ]);
  console.log('   ✅  I-5 We Have Cause to Be Uneasy\n');

  // ══════════════════════════════════════════════════════════════════════════
  // BOOK 2 — What Christians Believe
  // ══════════════════════════════════════════════════════════════════════════
  console.log('📖  Book II — What Christians Believe…');

  await insertCanto('mc-book-2', 1, 'The Rival Conceptions of God', [
    'Before discussing what Christians believe, Lewis surveys the landscape of possible views about ultimate reality. The most basic division is between those who believe in some kind of God and those who do not. But within theism there are further divisions, and understanding them helps clarify what Christianity uniquely claims.',
    'The atheist believes the universe is a self-sufficient material system with no mind or purpose behind it. Lewis does not argue at length here against atheism; that was the work of Book I. What he notes is that atheism requires us to regard our own sense of moral obligation — the "ought" that every human feels — as a meaningless noise produced by chemistry.',
    'Pantheism — the view that God is everything and everything is God — has wide appeal, particularly in Eastern religious traditions and in vague modern spirituality. It has the advantage of not separating God from the world. But Lewis argues it cannot sustain the idea of a God who is genuinely good, as opposed to neutral or beyond good and evil.',
    'The problem of evil provides a testing ground. If God is everything, evil is also part of God, and the distinction between good and evil collapses. The God of pantheism cannot call anything truly wrong. Christianity, by contrast, insists that God is wholly good and that evil is a real defect — something that ought not to exist.',
    'Lewis also introduces the internal evidence of human longing. Humans desire something they cannot find in the world: perfect justice, lasting beauty, unconditional love. This desire points beyond the world — toward something the world cannot supply. The Christian claim is that this something is a personal God.',
  ]);
  console.log('   ✅  II-1 The Rival Conceptions of God');

  await insertCanto('mc-book-2', 2, 'The Invasion', [
    'Lewis confronts the problem of evil directly. If there is a good God who made the world, why is there so much pain, cruelty, and injustice in it? This is the strongest objection to theism, and Lewis does not dismiss it.',
    'One popular answer is Dualism: the universe is governed by two equal and opposing powers — one good, one evil — locked in eternal conflict. This view is emotionally satisfying because it explains suffering without blaming God. But Lewis identifies a fatal flaw in it.',
    'To call one power "good" and the other "bad," you need a standard above both by which to judge them. Where does that standard come from? If it comes from a third power — then that is the real God. If it comes from one of the two — then you have already given one side a claim to authority that the other lacks. Either way, pure Dualism collapses.',
    'Christianity takes a different approach. It says there is one good God who created everything good. But something went wrong — a created being with free will chose wrongly, and evil entered the world as a corruption of good, not as an independent power. Evil, on this view, is always a parasite on goodness; it has no independent existence of its own.',
    'Lewis uses the image of enemy-occupied territory. This world is under the rule of something that has gone wrong — not permanently, but really. The Christian story is the story of a rightful King invading his own country, occupied by a usurper, in order to restore it. This is the drama that Book II will unfold.',
  ]);
  console.log('   ✅  II-2 The Invasion');

  await insertCanto('mc-book-2', 3, 'The Shocking Alternative', [
    'Christians believe that Jesus Christ is God — that the divine Mind behind the universe took on human form and walked among us. Lewis pauses to examine what Jesus himself actually claimed, because a great deal depends on getting this right.',
    'Many people — including many who reject Christianity — are happy to say Jesus was a great moral teacher. They admire his ethics while setting aside his divine claims. Lewis argues this position is not available. It is not coherent to admire Jesus\'s ethics while dismissing his most central self-descriptions as delusion or deception.',
    'Jesus did not merely claim to teach new moral truths. He claimed to forgive sins — all sins, including sins committed against other people. This is, Lewis notes, an extraordinary thing to say. If a stranger told you he forgave a murder committed against someone else, you would think him absurd. Forgiving sins against all people only makes sense if you are the party against whom all wrongs are ultimately committed.',
    'Jesus also claimed to be returning to judge the world, to have existed before Abraham, and to be the only path to the Father. These are not the words of a humble teacher. They are the words of someone who is either God, or who is profoundly mistaken about his own identity, or who is deliberately deceiving his followers.',
    'This is Lewis\'s famous trilemma: Lord, liar, or lunatic. Someone who said what Jesus said and was not God would be either a deliberate fraud or clinically deluded. Lewis argues the historical evidence and the moral character of Jesus make the fraud and lunacy options implausible. The "shocking alternative" — that he is who he claimed to be — deserves serious consideration.',
  ]);
  console.log('   ✅  II-3 The Shocking Alternative');

  await insertCanto('mc-book-2', 4, 'The Perfect Penitent', [
    'Christians say Christ\'s death "washes away sins" and "puts us right with God." Lewis acknowledges these formulas can sound magical or obscure. He attempts to explain what he understands them to mean, while being clear that no one theory of the Atonement has been made a required dogma — what matters is the fact, not the explanation.',
    'The problem is this: humans are in the wrong. We have persistently chosen our own way over the Moral Law, and we know it. Repentance — real repentance — means dying to the old self that committed the wrong. But we are weak. We cannot produce the kind of repentance that the situation requires. We cannot start fresh on our own.',
    'Lewis argues that what is needed is a perfect act of repentance — the kind of self-surrender that only a perfect being could make. But only a creature who has sinned has anything to repent of. This is the paradox: only Man can repent, but only God could do it perfectly. The solution Christianity proposes is that God became Man — entering the human condition to provide from within it the repentance that humanity could not generate on its own.',
    'The suffering of Christ is not arbitrary punishment. It is what genuine repentance costs — the death of the ego, the full bearing of what one\'s condition has produced. Christ bears this not as a substitute so humans do not have to, but as the one who makes it possible for humans to follow.',
    'Lewis ends by noting that these theories are attempts to map something too large for any map. What matters is that the death of Christ opens a door humans could not open themselves. How exactly that works is secondary; that it works is the claim of Christian experience across centuries.',
  ]);
  console.log('   ✅  II-4 The Perfect Penitent');

  await insertCanto('mc-book-2', 5, 'The Practical Conclusion', [
    'How does a person actually receive what Christ offers? Lewis outlines three main channels the Christian tradition has identified: Baptism, Belief, and the Lord\'s Supper. He is not prescriptive about which church a person should join — that is a matter for later, after the central question is settled.',
    'Lewis uses the image of a hallway connecting many rooms. The hallway is "mere Christianity" — the core beliefs shared across denominations. The rooms are the various churches. People may need to live in one of the rooms, not merely stand in the hallway. But the hallway is where they begin, and it deserves respect from all who have found rooms through it.',
    'Lewis addresses a common objection: why are there so many denominations if Christianity is true? He points out that divisions often occur not over the central Christian claims but over secondary questions. The core — the Moral Law, the God behind it, the Incarnation, the Atonement, the Resurrection — is held in common by Catholic, Orthodox, Protestant, and many others.',
    'The practical conclusion of Book II is that the decision about Jesus Christ is unavoidable. Having thought through the arguments, the reader stands at a fork. To shrug and move on unchanged is itself a choice. Lewis argues the evidence pushes strongly toward taking the Christian claim seriously — and that the next step is to examine what difference it makes to live as if it is true.',
    'Book III will turn to ethics and behavior. Having established the doctrinal framework, Lewis now asks: what does believing these things actually require of how a person lives?',
  ]);
  console.log('   ✅  II-5 The Practical Conclusion\n');

  // ══════════════════════════════════════════════════════════════════════════
  // BOOK 3 — Christian Behaviour
  // ══════════════════════════════════════════════════════════════════════════
  console.log('📖  Book III — Christian Behaviour…');

  await insertCanto('mc-book-3', 1, 'The Three Parts of Morality', [
    'Most public discussion of morality focuses entirely on one thing: how people treat each other. Fairness, honesty, kindness, respect for others\' rights — these dominate ethical debate. Lewis argues this covers only one of three domains that morality actually concerns.',
    'The second domain is the interior life of the individual — what is happening inside a person\'s soul. Greed, pride, cowardice, and lust do damage even when they are successfully concealed from others. A society of perfectly polite people who are all secretly rotten inside is not a moral success, whatever surface harmony it achieves.',
    'The third domain is the individual\'s relationship to the power that made them — what is sometimes called piety or religion. Whether or not God exists, a person\'s orientation toward ultimate questions — their sense of what they owe, what they depend on, what they are ultimately for — shapes everything else about their character.',
    'Lewis suggests that modern ethics has narrowed its attention almost entirely to the first domain while neglecting the other two. This produces an impoverished moral vision. A person can be outwardly decent by social standards while being inwardly disordered and spiritually blind — and Christian morality regards such a person as genuinely, not merely formally, lacking.',
    'This chapter sets the agenda for Book III: Lewis will address all three domains, working from social behavior inward to individual virtue and then outward again to the question of a person\'s relation to God.',
  ]);
  console.log('   ✅  III-1 The Three Parts of Morality');

  await insertCanto('mc-book-3', 2, "The 'Cardinal Virtues'", [
    'The ancient tradition of moral philosophy, inherited by Christianity, identified four fundamental virtues called "cardinal" from the Latin for hinge — these are the qualities on which a good human life turns. Lewis introduces them as a useful framework that belongs not only to Christians but to the whole human moral tradition.',
    'Prudence is practical wisdom — the ability to think clearly about what is genuinely good and how to achieve it. Lewis notes that this is not the same as timidity or excessive caution. It means being as intelligent as possible in one\'s moral decisions, not treating one\'s feelings or instincts as automatically trustworthy guides.',
    'Temperance means getting the right amount of everything, not just abstaining from excess. Lewis is careful to distinguish this from teetotalism or puritanism. Temperance applies to every appetite and pleasure — it is about proportion and appropriate enjoyment, not about treating pleasure itself as suspect.',
    'Justice covers the broad range of obligations to others: honesty, fair dealing, keeping promises, and meeting legitimate claims. It is what most people mean by "morality" in ordinary conversation, though Lewis has already shown it is only one dimension of the full moral picture.',
    'Fortitude encompasses both the courage to endure pain and hardship, and the courage to act rightly when it is dangerous or costly to do so. Lewis points out that fortitude is not a separate virtue so much as the quality every other virtue needs when things get hard. Without it, prudence, temperance, and justice collapse under pressure.',
  ]);
  console.log("   ✅  III-2 The 'Cardinal Virtues'");

  await insertCanto('mc-book-3', 3, 'Social Morality', [
    'Christianity does not offer a detailed economic or political blueprint. Lewis is frank about this. The New Testament says very little about social structures, and attempts to deduce a specific political program from the Gospels — whether socialist, capitalist, or otherwise — tend to reflect the interpreter\'s prior commitments more than the text itself.',
    'What Christianity does insist on, quite clearly, is the rule of fair dealing between people. The old maxim of giving everyone their due is thoroughly Christian. And that rule, consistently applied, has enormous social consequences: it rules out exploiting workers, cheating customers, ignoring poverty, or treating some classes of people as less than fully human.',
    'Lewis observes that the early Christians practiced a radical economic sharing, and that Christian moral thinking has always regarded extreme wealth inequality as at least morally troubling. He does not prescribe a particular remedy, but he says that a Christian cannot be indifferent to economic injustice by appealing to property rights alone.',
    'He also notes the fundamental principle that every person, however humble, bears infinite worth — because every person is made in the image of God and is a potential object of divine love. This conviction underlies every major social reform movement that drew on Christian energy: the abolition of slavery, the universal education movement, the campaign for women\'s rights.',
    'The chapter ends with a note on democracy. Lewis supports democracy not because the majority is always right, but because the Christian doctrine of the fall implies that no individual or group should be trusted with unchecked power. Distributed power and accountability are practical applications of realistic Christian anthropology.',
  ]);
  console.log('   ✅  III-3 Social Morality');

  await insertCanto('mc-book-3', 4, 'Morality and Psychoanalysis', [
    'In Lewis\'s time, psychoanalysis was a major cultural force. Many people worried that it undermined morality: if our behavior is determined by unconscious drives and early experiences, how can we be held morally responsible for it? Lewis argues that psychoanalysis and Christian morality are not in competition — they address entirely different levels of the same person.',
    'Psychoanalysis deals with the raw material: the temperament, anxieties, and complexes that form a person\'s starting point. It can help correct certain distortions — fears that are out of proportion, guilt that is misdirected, aggression that is rooted in childhood experience. This is genuine and valuable work.',
    'Christian morality begins where psychoanalysis ends. It addresses the choices made from within whatever temperament a person has been given or formed. The material itself is not a moral matter; what a person does with it is. A person born with a naturally easy temper who never has to struggle against irritability deserves less moral credit for their calmness than someone with a hot temper who fights it daily and usually wins.',
    'Lewis makes a point that challenges both therapeutic culture and self-congratulation: we cannot compare the moral achievements of different people, because we do not know their starting points. The person who seems mild and pleasant may simply have been given an easy nature. The person who seems to struggle and often fail may be waging battles invisibly that most people never have to face.',
    'God, Lewis suggests, judges us on what we do with what we have — not on how our output compares with others\' output. This is a word of mercy to those who feel perpetually defeated, and a word of warning to those who feel perpetually confident in their own virtue.',
  ]);
  console.log('   ✅  III-4 Morality and Psychoanalysis');

  await insertCanto('mc-book-3', 5, 'Sexual Morality', [
    'Lewis addresses the Christian teaching of chastity — that sexual activity belongs within marriage between a man and woman. He is aware this is one of the most widely rejected Christian doctrines, and he neither softens it nor apologizes for it. But he does distinguish it carefully from prudishness, which he regards as a different and less defensible thing.',
    'Chastity, Lewis says, is not about treating sex as shameful or disgusting. It is about recognizing that the sexual instinct, like every other human appetite, can become disordered — detached from its proper context and purpose. He uses the analogy of food: imagine a culture in which people attended shows where a covered plate was slowly unveiled to reveal a pork chop, while the audience worked themselves into a frenzy of excitement. We would think something had gone badly wrong with that culture\'s relationship to food.',
    'Lewis argues something comparable has happened with sex in modern Western culture. The appetite has been amplified far beyond its natural function. Advertising, entertainment, and public life are saturated with sexual stimulation in a way that historical comparisons suggest is genuinely abnormal, not merely different.',
    'He distinguishes the Christian standard — chastity — from its failure modes on both sides: promiscuity, which treats sex as having no special significance, and prudery, which treats it as inherently shameful. The Christian position holds sex in high regard precisely because it treats it seriously — as something powerful that belongs in a specific context.',
    'Lewis also makes clear that chastity is equally demanding for unmarried people and for married ones. The standard is the same regardless of circumstance, though the application differs. He acknowledges it is not an easy standard and that virtually everyone fails it at some level — but that does not make it wrong.',
  ]);
  console.log('   ✅  III-5 Sexual Morality');

  await insertCanto('mc-book-3', 6, 'Christian Marriage', [
    'The Christian view of marriage is that it is permanent — "till death do us part" is not a rhetorical flourish but the actual terms of the commitment. Lewis addresses two distinct questions: why permanence, and how to live within it when the feeling of love has faded.',
    'On permanence: Lewis distinguishes sharply between being "in love" and love itself. Falling in love is a wonderful experience, but it is a feeling and therefore transient. No feeling lasts forever, including this one. A marriage built only on the feeling of being in love will be in crisis the moment that feeling — as it always does — begins to ebb.',
    'Lewis argues that the commitment of marriage is precisely what creates conditions in which a deeper love can grow. The feeling of being in love is like the explosion that starts the engine; the ongoing life of love is what the engine actually does. The explosion is not the point; it is the beginning. Cultures that treat the feeling as the marriage have, in Lewis\'s view, misunderstood what marriage is for.',
    'Lewis also discusses the New Testament teaching about headship and submission in marriage. He is careful not to make too much of this: he says it applies only when genuine disagreement arises and a casting vote is needed. He also distinguishes between authority (a structural reality) and superiority (a claim to greater worth), insisting the two must never be confused.',
    'A note is added on the question of divorce and civil law. Lewis distinguishes between what Christianity teaches as an ideal and what the state may choose to permit. He argues Christians should not try to impose their own standard of permanence on non-Christians through law, while maintaining that the Christian view is genuinely better for human flourishing.',
  ]);
  console.log('   ✅  III-6 Christian Marriage');

  await insertCanto('mc-book-3', 7, 'Forgiveness', [
    'Lewis calls forgiveness one of the most unpopular of Christian teachings. Everyone approves of it in the abstract. Almost everyone finds it nearly impossible in the particular. The command to forgive enemies — not just inconveniences but people who have genuinely wronged you — goes against some of the deepest currents of human feeling.',
    'Lewis begins by dissolving a confusion about what forgiveness means. It does not mean pretending the wrong did not happen. It does not mean feeling warm and affectionate toward the person who harmed you. It does not mean forgoing all consequences or telling the wrongdoer they were right.',
    'The clue to what forgiveness actually means comes from examining how we forgive ourselves. When we have done something wrong, we often excuse it: we explain the circumstances, the pressures, the mitigating factors. We distinguish between the act and our overall character. We do not conclude that we are simply a bad person. Forgiveness means extending that same differentiation to someone else — not excusing the act but not damning the person either.',
    'Loving your neighbor as yourself does not mean feeling the same emotions toward your neighbor as toward yourself. Lewis points out that most people do not particularly like themselves much of the time. What they do is continue to wish themselves well, continue to work toward their own flourishing, even while being aware of their own failures. That is what we are to do for others.',
    'The hardest case is the person who has genuinely hurt us and shows no remorse. Lewis says little to make this easier. He notes only that practicing the outward acts of goodwill — not retaliating, not seeking to damage their reputation, treating them civilly — tends over time to shift the inner feeling in the direction of genuine forgiveness, even when it cannot be willed directly.',
  ]);
  console.log('   ✅  III-7 Forgiveness');

  await insertCanto('mc-book-3', 8, 'The Great Sin', [
    'Of all the vices, Lewis argues that pride is the most dangerous, the most pervasive, and the most invisible to its host. The Christian tradition has always placed pride at the top of the list of deadly sins, but modern culture has nearly forgotten this — or worse, has rebranded pride as something healthy.',
    'Pride is competitive by its very nature. The pleasure of pride is the pleasure of being above others. It does not take satisfaction in having something; it takes satisfaction in having more than someone else. If everyone became equally rich, the proud person would take no pleasure in their wealth. It is the comparison that delights them.',
    'This is why, Lewis suggests, pride is the anti-God attitude. A proud person cannot look up; they are too busy looking sideways to compare themselves with their neighbors, or looking down to confirm their superiority. A person full of pride has no room for God, because the essence of the encounter with God is the recognition that you are not the center — something else is, and vastly greater.',
    'Lewis makes a striking observation: people who are obsessed with their own goodness, their spiritual progress, their moral record — these people are in particular danger of pride. The very achievements that seem most admirable can become the material for the worst kind of self-congratulation. A person who prays daily and is proud of it is in a worse state than a person who does not pray but is at least humble.',
    'The diagnosis is uncomfortable because pride is the one vice that everyone can see in others and almost nobody can see in themselves. Lewis does not leave a loophole. If you think you are not proud, he says, you almost certainly are — because pride is precisely what prevents you from seeing it. The cure begins with catching a glimpse of how you look to someone else, and feeling the shock of it.',
  ]);
  console.log('   ✅  III-8 The Great Sin');

  await insertCanto('mc-book-3', 9, 'Charity', [
    'The word "charity" has been flattened in modern usage to mean donations to good causes. In the New Testament and the tradition Lewis is drawing on, it means something far more radical: agape, the love that wills the good of another regardless of feeling.',
    'Lewis makes a practical point that cuts against a common misunderstanding. People often say: "I cannot love someone I do not like." But they have confused two different things. The feelings of warmth, affection, and delight that we call "liking" are not under our direct control. The decision to act for someone\'s good — to wish them well, to avoid harming them, to help them when we can — is under our control.',
    'The Christian command is not "feel fond of your neighbor" but "do good to your neighbor and wish good for them." Lewis adds a startling observation that inverts common assumptions: if you act toward someone as if you love them — doing them good, thinking well of them, avoiding contempt — you may find that the feeling follows the action. Behavior shapes emotion as often as emotion drives behavior.',
    'This has a direct implication for people who find themselves without warm feelings toward God or toward other people. Lewis advises them not to wait for the feeling to arise before acting on the command. Act as if you have charity, and charity — the real thing — tends to grow.',
    'Lewis also addresses the relationship between charity and affection. Natural affection for family and friends is a good thing, but it is not the same as charity. Charity is more universal, less conditional, and does not depend on whether the other person has qualities we admire. It is modeled on the love God has for humanity — a love that loves not because of what the beloved has done to earn it, but because love is what God is.',
  ]);
  console.log('   ✅  III-9 Charity');

  await insertCanto('mc-book-3', 10, 'Hope', [
    'Christians are commanded to hope for heaven with all their heart. Lewis knows this sounds like escapism — the opiate of the masses, a distraction from pressing earthly problems. He argues the exact opposite is true.',
    'Lewis observes that humans experience a particular kind of longing that nothing in this world fully satisfies. Beauty, music, friendship, love — all point toward something. They give us a taste of what we are looking for, but the thing itself always seems to be just beyond what they deliver. We mistake the pointer for the thing pointed at, and then wonder why satisfaction keeps eluding us.',
    'He identifies three ways people handle this longing. The first is the Fool\'s way: continually believing that the next experience — the next relationship, the next success, the next pleasure — will finally deliver what the others didn\'t. This leads to restless dissatisfaction across a lifetime. The second is the Way of the Disillusioned Sensible Man: accept that these longings are fantasies and give them up. Settle for what the world actually offers. This produces a certain resigned contentment, but it kills something.',
    'The third way is the Christian way: recognize that these desires are real pointers to a real destination. The fact that nothing here fully satisfies is evidence that we were made for somewhere else. The longings are not to be destroyed but to be directed at their true object.',
    'Lewis argues that the great reformers and activists who did most for this world were often those who cared most about the next. When people are "too heavenly minded to be any earthly good," it is usually because their heavenly mindedness is superficial — a comfortable daydream rather than a serious hope. Real hope for heaven produces people who are, paradoxically, deeply engaged with the world, because they see it in the light of what it is being redeemed toward.',
  ]);
  console.log('   ✅  III-10 Hope');

  await insertCanto('mc-book-3', 11, 'Faith', [
    'Lewis addresses a pervasive misunderstanding about what "faith" means. Many people assume it means believing things without evidence — a willful act of credulity that overrides rational assessment. Lewis argues this is not what the Christian tradition means by it.',
    'The first meaning of faith Lewis identifies is something more modest: the art of holding on to conclusions your reason has reached, even when moods and feelings argue against them. This is not irrational at all. Reason does reach conclusions. But then moods, fatigue, temptation, and social pressure all conspire to make those conclusions feel doubtful or irrelevant. Faith is the habit of maintaining your rational conclusions under pressure.',
    'Lewis gives a vivid example: a person may be thoroughly convinced by the evidence that going to a dentist is safe and necessary. But in the dentist\'s waiting room, their nerves produce feelings that contradict this conviction. The feeling is real but not trustworthy. Faith is what allows the person to act on their reasoned conviction despite the feeling.',
    'The same pattern applies to Christian belief. A person may be persuaded by the arguments that God exists, that Christ\'s claims are credible, that Christianity is true. Then a mood descends — or they encounter a glib critic, or they have a bad day — and the belief seems distant and implausible. Faith is the discipline of holding the rational conclusion even when the emotional weather is stormy.',
    'This is why Christian practice — regular prayer, Scripture reading, attending worship — is not optional extra for believers. These practices are the means by which the rational conclusion is kept alive against the constant erosion of moods. The next chapter will address the deeper, more difficult meaning of faith.',
  ]);
  console.log('   ✅  III-11 Faith');

  await insertCanto('mc-book-3', 12, 'Faith (continued)', [
    'The higher and more central meaning of faith comes into view after a person has genuinely tried to live a moral life. They have applied themselves to the virtues, they have tried to be kind, honest, fair, and brave. And they have discovered — if they are honest — that they cannot do it. Not consistently, not reliably, not from the inside out. They can manage the surface while the interior remains unchanged.',
    'This discovery is the door to genuine faith. Lewis says that real progress in the Christian life only begins when a person gives up on the project of earning righteousness through their own effort and hands the whole enterprise over to God. This is not laziness — it is the recognition that the project you were trying to complete is beyond your own resources.',
    'The relationship between faith and works — the subject of much fierce theological debate since the Reformation — resolves itself, for Lewis, when the question is put correctly. Trying hard to do good is essential; it is what shows you your need. But salvation does not come from succeeding at this effort. It comes from recognizing you cannot succeed, and turning to the one who can transform you from within.',
    'Lewis uses the image of a person learning to swim by trusting the water to support them. The moment of letting go and trusting the medium is the decisive one. Before that, the swimmer is fighting the water; after it, the water works with them. Faith is the moment of trusting God rather than fighting him — of letting the divine life work from within rather than trying to achieve holiness entirely from outside it.',
    'Book III ends at this point of convergence: virtue and faith, effort and surrender, are not opposites but partners. The effort reveals the need; the faith opens the door. What that door leads into is the subject of Book IV.',
  ]);
  console.log('   ✅  III-12 Faith (continued)\n');

  // ══════════════════════════════════════════════════════════════════════════
  // BOOK 4 — Beyond Personality
  // ══════════════════════════════════════════════════════════════════════════
  console.log('📖  Book IV — Beyond Personality…');

  await insertCanto('mc-book-4', 1, 'Making and Begetting', [
    'Book IV moves into the deepest waters of Christian doctrine: the Trinity, the nature of divine life, and the relationship between God and humanity. Lewis begins with a distinction that is simple but carries enormous weight: the difference between making something and begetting something.',
    'When a person makes something — a chair, a painting, a machine — they produce an object of a different kind from themselves. The maker is a person; the thing made is not. But when a person begets a child, they produce something of the same kind as themselves: a person. The offspring shares the nature of the parent.',
    'Lewis applies this to the doctrine of Christ. Christians say that God "begot" the Son — not made him. This means the Son shares God\'s nature in a way that created things do not. A statue of a human being is not a human being; a human child is. The Son of God is not a very impressive creature — he is God in the fullest sense.',
    'This distinction matters enormously for what Christianity claims about human beings. The goal of the Christian life is not to be improved creatures but to become, in some real sense, participants in divine life — to share the very nature that the Son shares with the Father. The Greek Fathers called this deification (theosis). Lewis does not use the term but describes the reality.',
    'There are two kinds of life: what Lewis calls "Bios" (biological life) and "Zoe" (spiritual life — the divine kind). Humans have Bios. What God offers in Christ is Zoe — a different order of life altogether. This is not evolution but transformation: the offer to become something genuinely new.',
  ]);
  console.log('   ✅  IV-1 Making and Begetting');

  await insertCanto('mc-book-4', 2, 'The Three-Personal God', [
    'The doctrine of the Trinity — one God in three Persons — strikes many people as mathematical nonsense. Three persons equals three gods, not one. Lewis uses an analogy from geometry to suggest that the difficulty comes from approaching God with categories too small for the reality.',
    'A point exists in one dimension; it has position but no extension. A line exists in two dimensions; it is made of points but is something more than any single point. A three-dimensional figure is made of lines but is something more again. At each level, the richer reality includes and transcends the simpler one.',
    'Persons, as we experience them, exist at a certain level of reality. But God may exist at a level where the concept of "person" applies in a richer and more complex way than it does to us. Just as a square contains lines but also goes beyond them, the three-personal God contains what we call personhood but also transcends it.',
    'When Lewis says God is personal, he does not mean God is a person in quite the way we are. He means God is at least personal — not less than personal, not impersonal — something for which our experience of persons gives us the best available clue. The doctrine of the Trinity is the Church\'s attempt to describe this reality in the precise terms required by the evidence of Scripture and experience.',
    'Lewis adds that the experience of praying offers a glimpse of the Trinitarian reality. The person who prays is prompted from within by something (the Spirit), prays to God (the Father), while being able to do so because of the work of Christ (the Son). Three realities, one act. Theology is not abstract speculation but an attempt to describe what Christians actually encounter.',
  ]);
  console.log('   ✅  IV-2 The Three-Personal God');

  await insertCanto('mc-book-4', 3, 'Time and Beyond Time', [
    'A common objection to prayer runs as follows: if God already knows what will happen — if everything is predetermined from his eternal perspective — what difference can prayer possibly make? Is it not absurd to think that our words could alter plans that were fixed before the universe began?',
    'Lewis addresses this by examining the relationship between God and time. For creatures, time is a river we travel along: there is past behind us, present around us, and future ahead. We cannot see around the bend. But God, Lewis argues, is not in this river at all. He does not have a "before" and "after" in the way we do.',
    'The best analogy Lewis can find is an author in relation to a novel. The author is not inside the story — they do not experience the events sequentially in the way the characters do. They hold the whole story present simultaneously. God\'s relation to the whole of time is something like this: every moment that ever was or will be is, for God, fully present.',
    'This means that when God "answers prayer," he is not reacting to information that has just reached him. He knew the prayer before the universe existed, and he incorporated it — together with his response — into the fabric of reality from the beginning. The prayer does not change a plan that was already fixed; it is part of what the plan already included.',
    'Lewis acknowledges this is difficult to imagine, because we are thoroughly temporal creatures. He does not claim to explain it fully. He offers it as a way of showing that the objection — prayer cannot change an eternal God — may rest on a misunderstanding of what eternity actually means. An eternal God is not a very old God; he is a God outside time entirely.',
  ]);
  console.log('   ✅  IV-3 Time and Beyond Time');

  await insertCanto('mc-book-4', 4, 'Good Infection', [
    'The three Persons of the Trinity exist in an eternal relationship of love. The Father loves the Son, the Son loves the Father, and this love between them is the Holy Spirit. This is not a static arrangement but a dynamic, flowing reality — what Lewis calls the "dance" of divine love.',
    'The remarkable claim of Christianity is that human beings are invited into this dance. The divine life is not sealed off from humanity; it is offered to humanity. When a person comes to Christ — through faith, prayer, the Eucharist, and the community of the Church — they begin to be drawn into the relationship that the Persons of the Trinity have with each other.',
    'Lewis uses the image of infection — a "good infection." Just as a disease spreads through contact, so the divine life spreads through contact with Christ. One infected person can pass the life on to others. This is not a metaphor for mere moral influence; it is Lewis\'s description of something the Christian tradition calls grace — a real transmission of spiritual life.',
    'This spreading dynamic explains why Christianity is not simply about private salvation. If you have received something real, you cannot simply keep it to yourself — not out of duty but because the nature of this life is to expand. A light that merely illuminates itself is not doing what light does.',
    'Lewis is also careful to note that this divine life is not something Christians manufacture or deserve. It comes from outside them and works within them. The human role is to open the door — through prayer, repentance, and the sacraments — and allow the infection to do its work.',
  ]);
  console.log('   ✅  IV-4 Good Infection');

  await insertCanto('mc-book-4', 5, 'The Obstinate Toy Soldiers', [
    'Lewis returns to the question of the Incarnation — why God became human — and illuminates it through one of his most memorable analogies. Imagine a child who has a collection of toy soldiers. Suppose the child wanted, more than anything, for those toy soldiers to become real — genuinely alive in the fullest sense. The only way to achieve that transformation would be for the child themselves to somehow become a toy soldier.',
    'Humans are, in this analogy, the toy soldiers. We are alive in the biological sense — we eat, breathe, reproduce, feel. But we are not alive in the divine sense. God is alive in a fuller, richer way than we are, and the gap between his kind of life and ours is not merely a difference of degree but a difference of kind.',
    'For humans to be made genuinely alive in the divine sense, God had to enter the human condition — to become a "toy soldier." This is the Incarnation. Christ is the child who became a toy soldier in order to begin the process of making all the toy soldiers real. His humanity was the foothold from which the transformation begins.',
    'Lewis notes that this process is already happening. Every person who responds to Christ, every act of genuine love, every moment of real self-surrender, is a small step in the direction of the toy soldiers coming alive. The process is slow and often painful — dying to the old life of mere biology always is — but it is real.',
    'The chapter also addresses why God chose this method. Could he not simply have declared humanity transformed by fiat? Lewis suggests that the kind of life being given is one that cannot be imposed from outside; it must be chosen from within. The Incarnation is how God created the conditions in which free creatures could genuinely enter into the divine life.',
  ]);
  console.log('   ✅  IV-5 The Obstinate Toy Soldiers');

  await insertCanto('mc-book-4', 6, 'Two Notes', [
    'Lewis pauses to clear up two misunderstandings that can easily arise from the doctrinal discussions in Book IV.',
    'The first note concerns the relationship between theology and direct experience of God. Theology, Lewis says, is like a map. A map of the Atlantic Ocean is not the Atlantic Ocean — it is a set of symbols on paper. But it is far more useful than vague personal impressions if you want to cross the ocean. The map was made by people who have actually made the crossing, and it encodes real experience systematically. Likewise, theology is not a substitute for encountering God; it is a set of tools, refined over centuries, for understanding and navigating that encounter.',
    'People who say they have no use for theology and prefer direct experience of God are rather like people who say they prefer the ocean to any map and so will rely entirely on their own impressions for navigation. The ocean may be richer and more real than any map — but without the map, you are likely to drown.',
    'The second note addresses the masculine language used for God: "he," "Father," "Son." Lewis is clear that God is not male in the physical sense — God has no body. But the masculine language is not arbitrary. Throughout the human experience of God, God has always been experienced as the initiator, the giver, the one who approaches — while the human soul, regardless of its biological sex, is in the receptive position. The masculine language reflects this asymmetry of initiative, not a claim about gender.',
    'Lewis notes that paganism, by contrast, often produced both male and female deities — and that the female figures tend to be associated with nature and earth. The God of the Bible is consistently transcendent, always approaching from beyond rather than being the immanent force within nature. These two brief notes prevent confusion that could derail what comes next.',
  ]);
  console.log('   ✅  IV-6 Two Notes');

  await insertCanto('mc-book-4', 7, "Let's Pretend", [
    'Lewis focuses on the opening words of the Lord\'s Prayer: "Our Father." When Christians say this, they are doing something audacious. They are addressing the maker of the universe as their parent. And the question Lewis raises is: are they entitled to do that?',
    'He distinguishes two senses in which a person can be a "child of God." In the broad sense, all humans are God\'s creatures and in that sense his children — as a painting might be said to belong to its painter. But in the deeper sense that the New Testament means — the sense of sharing the divine nature, of participating in the Son\'s relationship to the Father — this is something that must be entered into.',
    'This is where pretending comes in. When you say "Our Father" and do not yet feel it as fully real, you are pretending — putting on the posture of a child of God. But Lewis argues this pretending is not hypocrisy. It is more like a person who puts on the mask of a face more courageous than their own, and finds, over time, that the face has grown into the mask.',
    'The act of praying as if you are God\'s child, addressing him as Father, submitting yourself to Christ — these outward forms gradually work inward. The Holy Spirit, who prompted the prayer in the first place, uses it as a vehicle to transform the one who prays. The pretense is, in that sense, the beginning of the reality.',
    'This chapter brings together several threads: the importance of outward practice even when inner feeling is absent, the way charity-in-action leads to charity-as-feeling, and the overarching claim that the Christian life is a process of genuine transformation — not merely moral improvement but ontological change, becoming something one was not before.',
  ]);
  console.log("   ✅  IV-7 Let's Pretend");

  await insertCanto('mc-book-4', 8, 'Is Christianity Hard or Easy?', [
    'The question has an answer that is paradoxical: Christianity is both harder than people expect and easier than they fear, for reasons that are connected.',
    'It is harder than people expect because Christ does not ask for a portion of your time, energy, and attention while you retain sovereignty over the rest. He asks for everything. The common approach is to budget for God — to give him certain duties, certain hours, certain money — while maintaining control over the bulk of one\'s life. Lewis says this is not what is on offer. What is on offer requires a complete surrender of the self.',
    'This seems impossibly demanding. But Lewis argues it is actually easier in a deeper sense — because the thing being asked for is what we were designed for. Trying to live primarily for ourselves is like trying to run an engine on the wrong fuel. The engine was not designed for it; it strains and struggles. The Christian life, in contrast, is running on the right fuel. There is a naturalness and a rightness to it that the self-directed life never quite achieves.',
    'Lewis uses the analogy of a toothache. Imagine someone who has a toothache and knows the dentist will cure it but fears that if he goes, the dentist will find other things wrong and insist on fixing those too. So he puts it off and manages the pain. God is like the dentist — he will not be content with fixing just the one presenting symptom. He wants to fix everything. This feels like an imposition until you realize that everything that needs fixing was causing pain you had simply stopped noticing.',
    'The Christian offer is: give up the project of running your own life, and receive in exchange a life that is genuinely worth having. The hard part is the giving up; the easy part — the almost-too-good-to-believe part — is what replaces it.',
  ]);
  console.log('   ✅  IV-8 Is Christianity Hard or Easy?');

  await insertCanto('mc-book-4', 9, 'Counting the Cost', [
    'Lewis uses an image from George MacDonald, the Scottish author he credits as his master: imagine you are a living house that God has come to renovate. You expected modest repairs — fix the leaking roof, mend the drains. Instead, the contractor tears down walls, adds new rooms, rebuilds the foundations. The work is far more extensive and disruptive than you bargained for.',
    'The reason is that God is not building the kind of house you had in mind. He is building a palace — because he intends to live in it himself. The scope of the renovation corresponds to the purpose: not a temporary dwelling for a temporary occupant, but an eternal residence for the eternal God.',
    'This is why conversion, in the Christian sense, is never a completed achievement but always an ongoing process. Every person who honestly tries to follow Christ discovers levels of selfishness, pride, and disordered desire that they had not previously noticed. God keeps renovating — keeps addressing areas of the life that the person had hoped to leave alone.',
    'Lewis argues this is not cruelty but love. A parent who loved their child would not leave them with a cavity simply because treating it would be uncomfortable. The discomfort of growth is inseparable from the goal of growth. What feels like intrusion is actually attention — the focused attention of a craftsman who knows what the material can become and is not willing to settle for less.',
    'The chapter is a word of preparation for anyone who feels that the Christian life is not turning out to be as peaceful and tidy as they hoped. The answer is not to revise the goal downward. The cost is being counted accurately — and the prize is worth the cost.',
  ]);
  console.log('   ✅  IV-9 Counting the Cost');

  await insertCanto('mc-book-4', 10, 'Nice People or New Men', [
    'A common objection to Christianity goes like this: I know many non-Christians who are much nicer than most Christians I know. If Christianity makes people better, why doesn\'t it show? Why are churchgoers often less pleasant than thoughtful atheists?',
    'Lewis takes this objection seriously and gives it several careful answers. The first is that we cannot know what a person would be like without the influences that have shaped them. The pleasant atheist may have been formed by a culture soaked in residual Christian values — honesty, kindness, fairness — which they have absorbed without acknowledging their source. Remove those influences, and the outcome might be different.',
    'The second answer is more penetrating. God does not promise to make nice people nicer. He promises to make new people — something qualitatively different. The category "nice" belongs to the natural level of human personality. "New" belongs to a different order altogether. A very nice natural person and a genuinely new person — a person being transformed by divine life — are not on the same scale.',
    'Lewis offers an analogy: a tin soldier and a live soldier are not comparable by the standards of tin soldiers. The live soldier is not merely a better-polished tin soldier; he is a different kind of thing entirely. Judging Christian transformation by the standard of natural niceness is like judging a living person by the standard of a well-made statue.',
    'That said, Lewis does not excuse the very real failures of Christians. He acknowledges that people who have received the divine life and continue to act badly are more culpable, not less, than those who never had it. The point is not to excuse Christian failures but to clarify what Christianity is actually trying to produce.',
  ]);
  console.log('   ✅  IV-10 Nice People or New Men');

  await insertCanto('mc-book-4', 11, 'The New Men', [
    'Lewis closes the book by describing the destination toward which everything has been pointing. The Christian claim is not simply that individuals will be improved or that heaven will be pleasant. It is that something entirely new is being born — a new kind of being that has never existed before, and that we can barely imagine from where we currently stand.',
    'The analogy Lewis draws is from biological evolution. If you had described a human being to an early fish, the fish could not have imagined consciousness, love, humor, or beauty — categories that lie entirely beyond its frame of reference. What is coming next — the full realization of divinely transformed humanity — is as far beyond our current imagination as human consciousness is beyond the fish.',
    'Lewis observes that the people in whom this new life is most advanced are often recognizable by a paradox: they are simultaneously more themselves and more like each other than ordinary people. The fear that becoming deeply Christian means losing one\'s individuality is groundless. The divine life does not stamp out personality; it fulfills it. What it destroys is the false self that was built on pride and self-will.',
    'He ends with an observation about how this transformation happens. It does not happen through concentrated introspection or self-improvement programs. It happens in the midst of ordinary life — in the small acts of obedience, in the daily practice of prayer, in the moments of choosing against self-interest. The new person is not assembled deliberately; it grows, like a plant, through a process mostly invisible to the grower.',
    'The book\'s final words turn outward. Lewis does not describe a destination one reaches and then rests at. The divine life is inherently expansive. Those who have received it pass it on — not by preaching necessarily, but by being what they are. The new humanity is not a finished project but an ongoing one, and every person who turns toward God becomes a new point from which the life spreads further.',
  ]);
  console.log('   ✅  IV-11 The New Men\n');

  console.log('\n🎉  Done! Mere Christianity seeded.');
}

main().catch((e) => { console.error(e); process.exit(1); });
