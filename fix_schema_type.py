import sys

def fix_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace("responseSchema: schema,", "responseSchema: schema as any,")

    with open(filepath, "w") as f:
        f.write(content)

fix_file("src/app/api/onboarding/scrape-url/route.ts")
fix_file("src/app/api/onboarding/upload-file/route.ts")
