"""
Скрипт для добавления тестовых данных.
Запуск: python seed_data.py
"""
import storage

storage.init_db()

# ─── Теги экспертизы ──────────────────────────────────────────────────────────
tags_to_add = [
    'Frontend', 'Backend', 'DevOps', 'Mobile', 'Data Science',
    'AI/ML', 'QA', 'Product', 'Security', 'Architecture',
]
tag_map = {}
for name in tags_to_add:
    tag = storage.add_expertise_tag(name)
    tag_map[name] = tag
    print(f'  Тег: {name}')

print(f'\nДобавлено тегов: {len(tag_map)}')

# ─── Спикеры ─────────────────────────────────────────────────────────────────
speakers_data = [
    {
        'name': 'Алексей Смирнов',
        'role': 'Senior Frontend Developer',
        'email': 'a.smirnov@company.ru',
        'telegram': 'alexey_smirnov',
        'expertise': ['Frontend', 'Architecture'],
    },
    {
        'name': 'Мария Петрова',
        'role': 'ML Engineer',
        'email': 'm.petrova@company.ru',
        'telegram': 'masha_petrova',
        'expertise': ['AI/ML', 'Data Science'],
    },
    {
        'name': 'Дмитрий Козлов',
        'role': 'DevOps Lead',
        'email': 'd.kozlov@company.ru',
        'telegram': 'dima_kozlov',
        'expertise': ['DevOps', 'Backend'],
    },
    {
        'name': 'Анна Волкова',
        'role': 'iOS Developer',
        'email': 'a.volkova@company.ru',
        'telegram': 'anna_volkova',
        'expertise': ['Mobile', 'Frontend'],
    },
    {
        'name': 'Сергей Новиков',
        'role': 'Principal Engineer',
        'email': 's.novikov@company.ru',
        'telegram': 'sergey_nov',
        'expertise': ['Backend', 'Architecture', 'Security'],
    },
    {
        'name': 'Екатерина Иванова',
        'role': 'Product Manager',
        'email': 'e.ivanova@company.ru',
        'telegram': '',
        'expertise': ['Product'],
    },
]

added_speakers = []
for data in speakers_data:
    spk = storage.add_speaker(data)
    added_speakers.append(spk)
    print(f'  Спикер: {spk["name"]} ({spk["role"]})')

print(f'\nДобавлено спикеров: {len(added_speakers)}')

# Удобный доступ по имени
spk_by_name = {s['name']: s for s in added_speakers}

# ─── Активности ───────────────────────────────────────────────────────────────
activities_data = [
    {
        'name': 'Микрофронтенды: от монолита к независимым командам',
        'format': 'speech',
        'description': 'Рассказываем о том, как мы разбили монолитный фронтенд на независимые микрофронтенды, какие инструменты использовали и с какими проблемами столкнулись в процессе.',
        'speaker_ids': [spk_by_name['Алексей Смирнов']['id']],
        'date': '2025-03-15',
        'event': 'HighLoad++ 2025',
        'expertise_tags': ['Frontend', 'Architecture'],
    },
    {
        'name': 'LLM в production: уроки первого года',
        'format': 'speech',
        'description': 'Поделимся опытом внедрения больших языковых моделей в реальные продукты: оценка качества, мониторинг, оптимизация стоимости и работа с hallucinations.',
        'speaker_ids': [
            spk_by_name['Мария Петрова']['id'],
            spk_by_name['Сергей Новиков']['id'],
        ],
        'date': '2025-04-02',
        'event': 'AI Conference Moscow',
        'expertise_tags': ['AI/ML', 'Backend'],
    },
    {
        'name': 'GitOps и Platform Engineering в крупной компании',
        'format': 'speech',
        'description': 'Как построить Internal Developer Platform с нуля: ArgoCD, Backstage, Crossplane. Реальные кейсы и антипаттерны.',
        'speaker_ids': [spk_by_name['Дмитрий Козлов']['id']],
        'date': '2024-11-20',
        'event': 'DevOps Conf 2024',
        'expertise_tags': ['DevOps'],
    },
    {
        'name': 'SwiftUI в 2025: что нового и стоит ли переходить',
        'format': 'article',
        'description': 'Подробный разбор новинок SwiftUI, сравнение с UIKit, рекомендации для команд, начинающих миграцию.',
        'speaker_ids': [spk_by_name['Анна Волкова']['id']],
        'date': '2025-02-10',
        'event': 'Habr',
        'expertise_tags': ['Mobile'],
    },
    {
        'name': 'Как мы запустили внутреннюю платформу данных',
        'format': 'article',
        'description': 'История создания Data Platform: выбор стека (Spark, Airflow, dbt), организация data mesh, работа с metadata.',
        'speaker_ids': [spk_by_name['Мария Петрова']['id']],
        'date': '2024-12-05',
        'event': 'Habr',
        'expertise_tags': ['Data Science'],
    },
    {
        'name': 'Zero Trust Security: практика внедрения',
        'format': 'speech',
        'description': 'Пошаговое внедрение Zero Trust в компании: identity-driven access, microsegmentation, continuous verification.',
        'speaker_ids': [spk_by_name['Сергей Новиков']['id']],
        'date': '2024-10-08',
        'event': 'IT Security Forum',
        'expertise_tags': ['Security', 'Architecture'],
    },
    {
        'name': 'Вебинар: продуктовое мышление для разработчиков',
        'format': 'digital',
        'description': 'Онлайн-вебинар о том, как разработчику думать как продакт: метрики, impact mapping, работа с беклогом.',
        'speaker_ids': [
            spk_by_name['Екатерина Иванова']['id'],
            spk_by_name['Алексей Смирнов']['id'],
        ],
        'date': '2025-01-22',
        'event': 'YouTube / внутренний вебинар',
        'expertise_tags': ['Product', 'Frontend'],
    },
    {
        'name': 'TypeScript 5.x: практические паттерны',
        'format': 'digital',
        'description': 'Запись онлайн-митапа по продвинутым возможностям TypeScript: conditional types, template literal types, satisfies.',
        'speaker_ids': [spk_by_name['Алексей Смирнов']['id']],
        'date': '2024-09-17',
        'event': 'Внутренний митап',
        'expertise_tags': ['Frontend'],
    },
    {
        'name': 'Будущее React: Server Components и что дальше',
        'format': 'speech',
        'description': 'Доклад запланирован на конференцию. Разберём React Server Components, Suspense, новую архитектуру и что это значит для существующих проектов.',
        'speaker_ids': [spk_by_name['Алексей Смирнов']['id']],
        'date': '2025-09-10',
        'event': 'FrontendConf 2025',
        'expertise_tags': ['Frontend'],
    },
]

for data in activities_data:
    act = storage.add_activity(data)
    print(f'  Активность [{act["format"]}]: {act["name"]}')

print(f'\nДобавлено активностей: {len(activities_data)}')
print('\n✓ Готово! Перезагрузите страницу.')
