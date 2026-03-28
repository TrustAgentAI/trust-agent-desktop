import json, os, sys

ROLES_DIR = r"C:/Users/user/Documents/trust-agent-desktop/src/data/roles"

def expand_role(slug, extra_text):
    fp = os.path.join(ROLES_DIR, f"{slug}.json")
    with open(fp, 'r', encoding='utf-8') as f:
        data = json.load(f)
    old = len(data['systemPrompt'])
    data['systemPrompt'] += extra_text
    new = len(data['systemPrompt'])
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    # verify
    with open(fp, 'r', encoding='utf-8') as f:
        json.load(f)
    status = 'PASS' if new >= 12000 else 'NEEDS MORE'
    print(f"{slug}: {old} -> {new} ({status})")

if __name__ == '__main__':
    role = sys.argv[1]
    text_file = sys.argv[2]
    with open(text_file, 'r', encoding='utf-8') as f:
        txt = f.read()
    expand_role(role, txt)
