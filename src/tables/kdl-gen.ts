import { DefaultData, DDItem } from "./makeDefault.js";
export class DefaultTablesData {
static tableData(): DefaultData {
const tablesData = new DefaultData ([
DDItem.simple('tables', undefined, {version: '0'}, []),
new DDItem("questions", undefined, {}, [
DDItem.simple("-",  "impossible", {display: "impossible", mod: "-5", }),
DDItem.simple("-",  "nearly_impossible", {display: "nearly impossible", mod: "-4", }),
DDItem.simple("-",  "very_unlikely", {display: "very unlikely", mod: "-2", }),
DDItem.simple("-",  "unlikely", {display: "unlikely", mod: "-1", }),
DDItem.simple("-",  "50_50", {display: "50/50", mod: "0", }),
DDItem.simple("-",  "likely", {display: "likely", mod: "1", }),
DDItem.simple("-",  "very_likely", {display: "very likely", mod: "2", }),
DDItem.simple("-",  "almost_certain", {display: "almost certain", mod: "4", }),
DDItem.simple("-",  "certain", {display: "certain", mod: "5", }),
]),
new DDItem("fate", undefined, {}, [
DDItem.simple("-",  "Exceptional No", {weight: "3", }),
DDItem.simple("-",  "No", {weight: "6", }),
DDItem.simple("-",  "Yes", {weight: "7", }),
DDItem.simple("-",  "Exceptional Yes", {weight: "4", }),
]),
new DDItem("eventFocus", undefined, {dice: "2d10", }, [
DDItem.simple("-",  "Remote Event", {weight: "5", }),
DDItem.simple("-",  "Ambigious Event", {weight: "5", }),
DDItem.simple("-",  "New NPC", {weight: "10", interpretation: "newnpc", }),
DDItem.simple("-",  "NPC Action", {weight: "20", interpretation: "character", }),
DDItem.simple("-",  "NPC Negative", {weight: "5", interpretation: "character", }),
DDItem.simple("-",  "NPC Positive", {weight: "5", interpretation: "character", }),
DDItem.simple("-",  "Move Toward A Thread", {weight: "5", interpretation: "thread", }),
DDItem.simple("-",  "Move Away From A Thread", {weight: "10", interpretation: "thread", }),
DDItem.simple("-",  "Close A Thread", {weight: "5", interpretation: "thread", protect: "true", }),
DDItem.simple("-",  "PC Negative", {weight: "10", }),
DDItem.simple("-",  "PC Positive", {weight: "5", }),
DDItem.simple("-",  "Current Context", {weight: "15", }),
]),
new DDItem("objects", undefined, {}, [
DDItem.simple("-",  "thread", {display: "Thread", description: "threads", progress: "true", }),
DDItem.simple("-",  "character", {display: "Character", description: "characters", }),
]),
new DDItem("simples", undefined, {}, [
DDItem.simple("-",  "note", {display: "Note", description: "note", }),
DDItem.simple("-",  "ooc", {display: "Out of Character", description: "out of character", }),
DDItem.simple("-",  "todo", {display: "To Do", description: "to do", }),
]),
new DDItem("oracles", undefined, {}, [
new DDItem("table",  "whatever", {display: "SomethingOracle", description: "something oracle", }, [
DDItem.simple("-",  "something", {weight: "2", }),
DDItem.simple("-",  "something else", {weight: "8", }),
]),
new DDItem("table",  "traffic", {display: "TrafficLight", description: "traffic light", }, [
DDItem.simple("-",  "red", {weight: "90", }),
DDItem.simple("-",  "orange", {weight: "5", }),
DDItem.simple("-",  "green", {weight: "5", }),
]),
]),
new DDItem("oracles", undefined, {}, [
DDItem.simple("table",  "description1", {display: "Description", alt: "description2", }, [
"Adventurously", "Aggressively", "Anxiously", "Awkwardly", "Beautifully", "Bleakly", "Boldly", "Bravely", "Busily", "Calmly", "Carefully", "Carelessly", "Cautiously", "Ceaselessly", "Cheerfully", "Combatively", "Coolly", "Crazily", "Curiously", "Dangerously", "Defiantly", "Deliberately", "Delicately", "Delightfully", "Dimly", "Efficiently", "Emotionally", "Energetically", "Enormously", "Enthusiastically", "Excitedly", "Fearfully", "Ferociously", "Fiercely", "Foolishly", "Fortunately", "Frantically", "Freely", "Frighteningly", "Fully", "Generously", "Gently", "Gladly", "Gracefully", "Gratefully", "Happily", "Hastily", "Healthily", "Helpfully", "Helplessly", "Hopelessly", "Innocently", "Intensely", "Interestingly", "Irritatingly", "Joyfully", "Kindly", "Lazily", "Lightly", "Loosely", "Loudly", "Lovingly", "Loyally", "Majestically", "Meaningfully", "Mechanically", "Mildly", "Miserably", "Mockingly", "Mysteriously", "Naturally", "Neatly", "Nicely", "Oddly", "Offensively", "Officially", "Partially", "Passively", "Peacefully", "Perfectly", "Playfully", "Politely", "Positively", "Powerfully", "Quaintly", "Quarrelsomely", "Quietly", "Roughly", "Rudely", "Ruthlessly", "Slowly", "Softly", "Strangely", "Swiftly", "Threateningly", "Timidly", "Very", "Violently", "Wildly", "Yieldingly", ]
),
DDItem.simple("table",  "description2", {noAlt: "true", }, [
"Abnormal", "Amusing", "Artificial", "Average", "Beautiful", "Bizarre", "Boring", "Bright", "Broken", "Clean", "Cold", "Colorful", "Colorless", "Comforting", "Creepy", "Cute", "Damaged", "Dark", "Defeated", "Dirty", "Disagreeable", "Dry", "Dull", "Empty", "Enormous", "Extraordinary", "Extravagant", "Faded", "Familiar", "Fancy", "Feeble", "Festive", "Flawless", "Forlorn", "Fragile", "Fragrant", "Fresh", "Full", "Glorious", "Graceful", "Hard", "Harsh", "Healthy", "Heavy", "Historical", "Horrible", "Important", "Interesting", "Juvenile", "Lacking", "Large", "Lavish", "Lean", "Less", "Lethal", "Lively", "Lonely", "Lovely", "Magnificent", "Mature", "Messy", "Mighty", "Military", "Modern", "Mundane", "Mysterious", "Natural", "Normal", "Odd", "Old", "Pale", "Peaceful", "Petite", "Plain", "Poor", "Powerful", "Protective", "Quaint", "Rare", "Reassuring", "Remarkable", "Rotten", "Rough", "Ruined", "Rustic", "Scary", "Shocking", "Simple", "Small", "Smooth", "Soft", "Strong", "Stylish", "Unpleasant", "Valuable", "Vibrant", "Warm", "Watery", "Weak", "Young", ]
),
DDItem.simple("table",  "action1", {display: "Action", alt: "action2", }, [
"Abandon", "Accompany", "Activate", "Agree", "Ambush", "Arrive", "Assist", "Attack", "Attain", "Bargain", "Befriend", "Bestow", "Betray", "Block", "Break", "Carry", "Celebrate", "Change", "Close", "Combine", "Communicate", "Conceal", "Continue", "Control", "Create", "Deceive", "Decrease", "Defend", "Delay", "Deny", "Depart", "Deposit", "Destroy", "Dispute", "Disrupt", "Distrust", "Divide", "Drop", "Easy", "Energize", "Escape", "Expose", "Fail", "Fight", "Flee", "Free", "Guide", "Harm", "Heal", "Hinder", "Imitate", "Imprison", "Increase", "Indulge", "Inform", "Inquire", "Inspect", "Invade", "Leave", "Lure", "Misuse", "Move", "Neglect", "Observe", "Open", "Oppose", "Overthrow", "Praise", "Proceed", "Protect", "Punish", "Pursue", "Recruit", "Refuse", "Release", "Relinquish", "Repair", "Repulse", "Return", "Reward", "Ruin", "Separate", "Start", "Stop", "Strange", "Struggle", "Succeed", "Support", "Suppress", "Take", "Threaten", "Transform", "Trap", "Travel", "Triumph", "Truce", "Trust", "Use", "Usurp", "Waste", ]
),
DDItem.simple("table",  "action2", {noAlt: "true", }, [
"Advantage", "Adversity", "Agreement", "Animal", "Attention", "Balance", "Battle", "Benefits", "Building", "Burden", "Bureaucracy", "Business ", "Chaos", "Comfort", "Completion", "Conflict", "Cooperation", "Danger", "Defense", "Depletion", "Disadvantage", "Distraction", "Elements", "Emotion", "Enemy", "Energy", "Environment", "Expectation", "Exterior", "Extravagance", "Failure", "Fame", "Fear", "Freedom", "Friend", "Goal", "Group", "Health", "Hindrance", "Home", "Hope", "Idea", "Illness", "Illusion", "Individual", "Information", "Innocent", "Intellect", "Interior", "Investment", "Leadership", "Legal", "Location", "Military", "Misfortune", "Mundane", "Nature", "Needs", "News", "Normal", "MythicObject", "Obscurity", "Official", "Opposition", "Outside", "Pain", "Path", "Peace", "People", "Personal", "Physical", "Plot", "Portal", "Possessions", "Poverty", "Power", "Prison", "Project", "Protection", "Reassurance", "Representative", "Riches", "Safety", "Strength", "Success", "Suffering", "Surprise", "Tactic", "Technology", "Tension", "Time", "Trial", "Value", "Vehicle", "Victory", "Vulnerability", "Weapon", "Weather", "Work", "Wound ", ]
),
DDItem.simple("table",  "characters", {}, [
"Active", "Artistic", "Average", "Beautiful", "Bizarre", "Bright", "Clothing", "Clue", "Cold", "Colorful", "Communication", "Complicated", "Confusing", "Consumable", "Container", "Creepy", "Crude", "Cute", "Damaged", "Dangerous", "Deactivated", "Deliberate", "Delightful", "Desired", "Domestic", "Empty", "Energy", "Enormous", "Equipment", "Expected", "Expended", "Extravagant", "Faded", "Familiar", "Fancy", "Flora", "Fortunate", "Fragile", "Fragrant", "Frightening", "Garbage", "Guidance", "Hard", "Harmful", "Healing", "Heavy", "Helpful", "Horrible", "Important", "Inactive", "Information", "Intriguing", "Large", "Lethal", "Light", "Liquid", "Loud", "Majestic", "Meaningful", "Mechanical", "Modern", "Moving", "Multiple", "Mundane", "Mysterious", "Natural", "New", "Odd", "Official", "Old", "Ornamental", "Ornate", "Personal", "Powerful", "Prized", "Protection", "Rare", "Ready", "Reassuring", "Resource", "Ruined", "Small", "Soft", "Solitary", "Stolen", "Strange", "Stylish", "Threatening", "Tool", "Travel", "Unexpected", "Unpleasant", "Unusual", "Useful", "Useless", "Valuable", "Warm", "Weapon", "Wet", "Worn", ]
),
DDItem.simple("table",  "characters", {}, [
"Accompanied", "Active", "Aggressive", "Ambush", "Animal", "Anxious", "Armed", "Beautiful", "Bold", "Busy", "Calm", "Careless", "Casual", "Cautious", "Classy", "Colorful", "Combative", "Crazy", "Creepy", "Curious", "Dangerous", "Deceitful", "Defeated", "Defiant", "Delightful", "Emotional", "Energetic", "Equipped", "Excited", "Expected", "Familiar", "Fast", "Feeble", "Feminine", "Ferocious", "Foe", "Foolish", "Fortunate", "Fragrant", "Frantic", "Friend", "Frightened", "Frightening", "Generous", "Glad", "Happy", "Harmful", "Helpful", "Helpless", "Hurt", "Important", "Inactive", "Influential", "Innocent", "Intense", "Knowledgeable", "Large", "Lonely", "Loud", "Loyal", "Masculine", "Mighty", "Miserable", "Multiple", "Mundane", "Mysterious", "Natural", "Odd", "Official", "Old", "Passive", "Peaceful", "Playful", "Powerful", "Professional", "Protected", "Protecting", "Questioning", "Quiet", "Reassuring", "Resourceful", "Seeking", "Skilled", "Slow", "Small", "Stealthy", "Strange", "Strong", "Tall", "Thieving", "Threatening", "Triumphant", "Unexpected", "Unnatural", "Unusual", "Violent", "Vocal", "Weak", "Wild", "Young", ]
),
DDItem.simple("table",  "locations", {}, [
"Abandoned", "Active", "Artistic", "Atmosphere", "Beautiful", "Bleak", "Bright", "Business", "Calm", "Charming", "Clean", "Cluttered", "Cold", "Colorful", "Colorless", "Confusing", "Cramped", "Creepy", "Crude", "Cute", "Damaged", "Dangerous", "Dark", "Delightful", "Dirty", "Domestic", "Empty", "Enclosed", "Enormous", "Entrance", "Exclusive", "Exposed", "Extravagant", "Familiar", "Fancy", "Festive", "Foreboding", "Fortunate", "Fragrant", "Frantic", "Frightening", "Full ", "Harmful", "Helpful", "Horrible", "Important", "Impressive", "Inactive", "Intense", "Intriguing", "Lively", "Lonely", "Long", "Loud", "Meaningful", "Messy", "Mobile", "Modern", "Mundane", "Mysterious", "Natural", "New", "Occupied", "Odd", "Official", "Old", "Open", "Peaceful", "Personal", "Plain", "Portal", "Protected", "Protection", "Purposeful", "Quiet", "Reassuring", "Remote", "Resourceful", "Ruined", "Rustic", "Safe", "Services", "Simple", "Small", "Spacious", "Storage", "Strange", "Stylish", "Suspicious", "Tall", "Threatening", "Tranquil", "Unexpected", "Unpleasant", "Unusual", "Useful", "Warm", "Warning", "Watery", "Welcoming", ]
),
]),
]);
return tablesData;
}
}

