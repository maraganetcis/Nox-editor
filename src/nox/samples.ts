import { ExampleScript } from './types';

export const NOX_EXAMPLES: ExampleScript[] = [
  {
    id: 'hello',
    category: '기초 (Basics)',
    title: 'Hello, NOX!',
    titleEn: 'Hello World',
    description: '기본 출력문 say, 변수 할당, 덧셈 연산 및 포함형 범위 for 반복문',
    tags: ['say', '변수', '범위'],
    code: `# NOX 프로그래밍 언어의 시작
say "Hello, NOX!"

name = "NOX Tablet IDE"
version = "2.0"

say "환영합니다, " + name + " (v" + version + ")"
say "10 + 20의 계산 결과:"
say 10 + 20

# 포함형 정수 범위 (1, 5)는 1부터 5까지 모두 포함합니다
say "카운트업:"
for n in (1, 5):
    say "단계 " + str(n) + " 완료"
`
  },
  {
    id: 'ranges',
    category: '기초 (Basics)',
    title: '포함형 범위 & 배열 탐색',
    titleEn: 'Inclusive Ranges & Lists',
    description: '양 끝을 모두 포함하는 NOX의 독특한 범위 문법 (a, b)와 리스트',
    tags: ['범위', '배열', 'for'],
    code: `# NOX의 (a, b) 표현식은 양 끝을 모두 포함하는 리스트를 생성합니다
say "오름차순 범위 (1, 5):"
say (1, 5)

say "내림차순 범위 (5, 1):"
say (5, 1)

say "동일한 값 (3, 3):"
say (3, 3)

# 리스트와 len() 함수 사용
fruits = ["사과", "바나나", "체리", "딸기"]
say "과일 목록: " + str(fruits)
say "과일의 총 개수: " + str(len(fruits))

# 리스트 요소 순회
say "하나씩 꺼내보기:"
for item in fruits:
    say "-> " + item
`
  },
  {
    id: 'condition',
    category: '조건문 (Conditionals)',
    title: '조건문 (if / elif / otherwise)',
    titleEn: 'Conditionals & Grades',
    description: '점수에 따라 성적을 판정하는 다중 조건 분기',
    tags: ['if', 'elif', 'otherwise'],
    code: `# 점수 판정 프로그램
scores = [95, 82, 73, 58]

for score in scores:
    say "===================="
    say "시험 점수: " + str(score) + "점"

    if score >= 90:
        say "등급: A+ (최우수)"
        say "축하합니다! 장학금 대상자입니다."
    elif score >= 80:
        say "등급: B (우수)"
        say "잘 하셨습니다!"
    elif score >= 70:
        say "등급: C (보통)"
        say "조금만 더 힘내세요."
    otherwise:
        say "등급: F (재시험)"
        say "다시 도전해보세요!"
`
  },
  {
    id: 'multiplication',
    category: '반복문 (Loops)',
    title: '구구단 2단 ~ 9단',
    titleEn: 'Multiplication Tables',
    description: '이중 for 루프를 사용한 완벽한 구구단 생성기',
    tags: ['구구단', '중첩 루프', '수학'],
    code: `# 중첩 for 반복문으로 구구단 출력하기
say "=== NOX 구구단 테이블 ==="

for dan in (2, 5):
    say ""
    say "[" + str(dan) + "단]"
    for num in (1, 9):
        result = dan * num
        say str(dan) + " x " + str(num) + " = " + str(result)
`
  },
  {
    id: 'fibonacci',
    category: '반복문 (Loops)',
    title: '피보나치 수열 & 골든 비율',
    titleEn: 'Fibonacci Sequence',
    description: '반복문과 변수 교환을 통한 피보나치 수열 생성',
    tags: ['피보나치', '수열', '알고리즘'],
    code: `# 피보나치 수열 15개 항 구하기
a = 0
b = 1
count = 15

say "피보나치 수열 (" + str(count) + "항):"
say "1: " + str(a)
say "2: " + str(b)

for i in (3, count):
    next_val = a + b
    say str(i) + ": " + str(next_val)
    a = b
    b = next_val

say "완료!"
`
  },
  {
    id: 'functions',
    category: '함수 (Functions)',
    title: '함수 정의 & 재사용 (fn)',
    titleEn: 'Functions & Math Tools',
    description: 'fn 키워드를 사용한 사용자 함수 정의 및 반환값 처리',
    tags: ['fn', '함수', 'return'],
    code: `# NOX 사용자 정의 함수 (fn 키워드)

fn square(x):
    return x * x

fn is_even(n):
    return (n % 2) == 0

fn calculate_circle_area(r):
    # 반지름으로 원의 넓이 계산 (원주율 약 3.14159)
    return round(3.14159 * square(r), 2)

say "5의 제곱: " + str(square(5))
say "12의 제곱: " + str(square(12))

say "홀짝 검사:"
for n in (1, 6):
    if is_even(n):
        say str(n) + " -> 짝수입니다."
    otherwise:
        say str(n) + " -> 홀수입니다."

say "반지름 7인 원의 넓이:"
say calculate_circle_area(7)
`
  },
  {
    id: 'prime_sieve',
    category: '함수 (Functions)',
    title: '소수(Prime) 탐색기',
    titleEn: 'Prime Number Checker',
    description: '특정 범위 내 모든 소수를 찾아내는 알고리즘',
    tags: ['소수', '알고리즘', '함수'],
    code: `# 소수(1과 자신으로만 나누어 떨어지는 수) 판별 함수
fn is_prime(n):
    if n <= 1:
        return false
    if n <= 3:
        return true
    if n % 2 == 0:
        return false
    
    # 3부터 sqrt(n)까지 검사
    limit = int(sqrt(n)) + 1
    for d in (3, limit):
        if d < n and n % d == 0:
            return false
    return true

say "1부터 50까지의 소수 목록:"
primes = []
for num in (1, 50):
    if is_prime(num):
        primes = primes + [num]

say primes
say "총 발견된 소수: " + str(len(primes)) + "개"
`
  },
  {
    id: 'dice_battle',
    category: '인터랙티브 & 게임 (Interactive)',
    title: '주사위 배틀 시뮬레이터',
    titleEn: 'Dice Battle Arena',
    description: 'random() 난수 함수를 활용한 몬스터와의 주사위 턴제 전투',
    tags: ['게임', 'random', 'while'],
    code: `# 턴제 주사위 전투 시뮬레이션
say "⚔️ NOX 주사위 아레나에 오신 것을 환영합니다! ⚔️"

player_hp = 100
dragon_hp = 120
round_num = 1

while player_hp > 0 and dragon_hp > 0:
    say "-------------------------"
    say "[라운드 " + str(round_num) + "]"
    
    # 플레이어 공격
    player_roll = random(10, 30)
    dragon_hp = max(0, dragon_hp - player_roll)
    say "용사 공격! 데미지 " + str(player_roll) + " 부여 (드래곤 체력: " + str(dragon_hp) + ")"
    
    if dragon_hp <= 0:
        say "드래곤을 무찔렀습니다! 용사의 승리입니다! 🎉"
        break
    
    # 드래곤 반격
    dragon_roll = random(8, 25)
    player_hp = max(0, player_hp - dragon_roll)
    say "드래곤 화염 발사! 데미지 " + str(dragon_roll) + " (용사 체력: " + str(player_hp) + ")"
    
    if player_hp <= 0:
        say "용사가 쓰러졌습니다... 다음 기회에! 💀"
        break
        
    round_num = round_num + 1

say "전투 종료!"
`
  },
  {
    id: 'canvas_rings',
    category: '캔버스 그래픽 (Canvas Art)',
    title: '동심원 무지개 아트',
    titleEn: 'Rainbow Concentric Rings',
    description: 'draw.circle를 활용하여 캔버스에 형형색색의 동심원 패턴 생성',
    tags: ['draw', '그래픽', '원'],
    code: `# 캔버스 그래픽 그리기
# 오른쪽 또는 아래의 [캔버스] 탭을 확인하세요!
draw.clear("#080f1d")

colors = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#818cf8", "#c084fc"]
center_x = 240
center_y = 160

say "🎨 무지개 동심원 그리는 중..."

for i in (1, 10):
    radius = (11 - i) * 14
    color = colors[i % len(colors)]
    draw.circle(center_x, center_y, radius, color, true)
    # 흰색 테두리 효과
    draw.circle(center_x, center_y, radius, "#ffffff", false)

# 중앙 중심점
draw.circle(center_x, center_y, 6, "#ffffff", true)
draw.text("NOX Canvas Art", 170, 305, "#94a3b8", 14)

say "캔버스 그래픽 완성! [캔버스] 탭에서 확인하세요."
`
  },
  {
    id: 'canvas_cosmos',
    category: '캔버스 그래픽 (Canvas Art)',
    title: '별빛 밤하늘 (Cosmos)',
    titleEn: 'Starlight Galaxy',
    description: 'random과 draw.star, draw.circle을 이용한 우주 은하수 생성기',
    tags: ['draw', '별빛', '우주'],
    code: `# 밤하늘의 별빛과 은하수 생성
draw.clear("#040814")

say "✨ 은하수를 수놓는 중입니다..."

# 50개의 작은 반짝이 별 생성
for i in (1, 60):
    sx = random(10, 470)
    sy = random(10, 310)
    brightness = random(1, 3)
    draw.circle(sx, sy, brightness, "#a5f3fc", true)

# 8개의 큰 황금별 생성
for i in (1, 8):
    sx = random(30, 450)
    sy = random(30, 280)
    draw.star(sx, sy, 5, 12, 5, "#fde047")

# 푸른 달 그리기
draw.circle(80, 80, 35, "#38bdf8", true)
draw.circle(92, 70, 30, "#040814", true) # 초승달 그림자

draw.text("NOX Cosmos 2026", 160, 290, "#38bdf8", 16)
say "완성되었습니다!"
`
  },
  {
    id: 'canvas_grid',
    category: '캔버스 그래픽 (Canvas Art)',
    title: '네온 사이버 격자 패턴',
    titleEn: 'Cyber Neon Matrix',
    description: '반복문으로 그리는 미래적인 네온 그리드와 중심 펄스',
    tags: ['draw', '격자', '네온'],
    code: `# 네온 사이버 매트릭스 패턴
draw.clear("#050811")

say "네온 그리드 생성 시작..."

# 격자선 그리기
for x in (0, 12):
    pos_x = x * 40
    draw.line(pos_x, 0, pos_x, 320, "#1e293b", 1)

for y in (0, 8):
    pos_y = y * 40
    draw.line(0, pos_y, 480, pos_y, "#1e293b", 1)

# 네온 사각형 블록들
colors = ["#06b6d4", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"]

for i in (1, 20):
    gx = random(1, 10) * 40 + 6
    gy = random(1, 6) * 40 + 6
    c = colors[i % len(colors)]
    draw.rect(gx, gy, 28, 28, c, true)

draw.text("NOX MATRIX ENGINE", 160, 25, "#38bdf8", 15)
say "그리드 렌더링 완료!"
`
  }
];
