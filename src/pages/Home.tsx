import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { add, documentTextOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';

import { loadNotes, newId, Note, saveNotes } from '../data/notes';
import './Home.css';

const Home: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const persist = (next: Note[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    setNotes(sorted);
    saveNotes(sorted);
  };

  const openEditor = (note?: Note) => {
    setEditing(note ?? null);
    setTitle(note?.title ?? '');
    setBody(note?.body ?? '');
  };

  const closeEditor = () => {
    setEditing(null);
    setTitle('');
    setBody('');
  };

  const save = () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) {
      closeEditor();
      return;
    }
    if (editing && editing.id) {
      persist(
        notes.map((n) =>
          n.id === editing.id
            ? { ...n, title: trimmedTitle, body: trimmedBody, updatedAt: Date.now() }
            : n,
        ),
      );
    } else {
      persist([
        { id: newId(), title: trimmedTitle, body: trimmedBody, updatedAt: Date.now() },
        ...notes,
      ]);
    }
    closeEditor();
  };

  const remove = (id: string) => persist(notes.filter((n) => n.id !== id));

  const [modalFlag, setModalFlag] = useState(false);

  const openNew = () => {
    openEditor();
    setModalFlag(true);
  };
  const openExisting = (note: Note) => {
    openEditor(note);
    setModalFlag(true);
  };
  const dismiss = () => {
    setModalFlag(false);
    closeEditor();
  };
  const commit = () => {
    save();
    setModalFlag(false);
  };

  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Note Taker</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Note Taker</IonTitle>
          </IonToolbar>
        </IonHeader>

        {notes.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={documentTextOutline} />
            <h2>No notes yet</h2>
            <p>Tap the + button to create your first note.</p>
          </div>
        ) : (
          <IonList>
            {notes.map((note) => (
              <IonItemSliding key={note.id}>
                <IonItem button onClick={() => openExisting(note)}>
                  <IonLabel>
                    <h2>{note.title || 'Untitled'}</h2>
                    <p className="note-preview">{note.body || 'No content'}</p>
                    <p className="note-date">{formatted.format(note.updatedAt)}</p>
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => remove(note.id)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={openNew} aria-label="Add note">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={modalFlag} onDidDismiss={dismiss}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={dismiss}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>{editing ? 'Edit Note' : 'New Note'}</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={commit}>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonInput
              label="Title"
              labelPlacement="floating"
              value={title}
              onIonInput={(e) => setTitle(e.detail.value ?? '')}
              placeholder="Note title"
            />
            <IonTextarea
              label="Note"
              labelPlacement="floating"
              value={body}
              onIonInput={(e) => setBody(e.detail.value ?? '')}
              autoGrow
              rows={10}
              placeholder="Write your note here..."
            />
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
